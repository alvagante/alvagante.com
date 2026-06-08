---
title: Training Pipeline Engineering
date: 2025-04-30
layout: post
category: play
collection: ai-blog
---
## Training Pipeline Engineering

Training pipelines are infrastructure problems with a math hat.

### The Pipeline Components

A training pipeline has four core components. Each is a potential failure point:

```python
"""
Training pipeline components:

1. Data Management (DVC, LakeFS, Delta Lake)
   - Version-control your data
   - Track which data was used for which model
   - Reproduce any experiment exactly
   - Without version control: "I'm not sure what data was used"
   - With version control: "Run dvc checkout dataset-v12.3 and rebuild"

2. Experiment Tracking (W&B, MLflow, Neptune)
   - Log hyperparameters, metrics, artifacts
   - Compare experiments visually
   - Track GPU hours per experiment
   - Without tracking: "I can't find which hyperparameters worked"
   - With tracking: "Compare experiments by loss, lr, epoch, GPU hours

3. Distributed Training (FSDP, DeepSpeed, Megatron)
   - Split computation across multiple GPUs
   - Synchronize gradients
   - Handle communication overhead
   - Without distributed: one GPU = slow training = wasted compute
   - With distributed: training 4x faster, communication cost < training cost

4. Checkpointing (save/restore)
   - Save model state periodically
   - Resume training from last checkpoint
   - Save the best model based on validation performance
   - Without checkpointing: crash = restart = lost training time
   - With checkpointing: crash = resume = 0% training time lost
"""
```

### Data Versioning (Why You Need DVC)

```python
"""
Data versioning is like git for datasets.

Without DVC:
    data/raw/
    data/processed/
    data/final/       ← who knows which is the right one?

With DVC:
    data/
    ├── raw.dvc       → hash of raw data (unchanged between versions)
    ├── processed.dvc → hash of processed data
    └── final.dvc     → hash of training data
    
    git diff: shows which data changed
    dvc checkout: reproduces the exact dataset used for this commit
"""
```

### Experiment Tracking (Why You Need MLflow/W&B)

```python
"""
Experiment tracking lets you:
1. Reproduce any experiment (hyperparameters + metrics = reproducibility)
2. Compare experiments (which lr worked best?)
3. Track GPU hours (which experiments were too expensive?)
4. Find the best model (which checkpoint had lowest validation loss?)

MLflow example:
    import mlflow
    with mlflow.start_run() as run:
        mlflow.log_param("lr", 3e-4)
        mlflow.log_param("epochs", 3)
        mlflow.log_metric("train_loss", 2.5)
        mlflow.log_metric("val_loss", 2.8)
        mlflow.log_artifact("best_model.pt")

W&B example:
    import wandb
    wandb.init(project="my-model", config={"lr": 3e-4, "epochs": 3})
    wandb.log({"train_loss": 2.5, "val_loss": 2.8})
    wandb.run.log_model("best_model.pt")

Choose:
- MLflow: open-source, self-hosted, more flexible
- W&B: cloud-native, beautiful UI, better visualization
- Neptune: enterprise-grade, good for teams
"""
```

### Distributed Training Patterns

```python
"""
Distributed training patterns, ranked by complexity:

1. Data Parallelism (DistributedDataParallel — DDP/FSDP)
   - Each GPU has the full model, processed different data batches
   - Synchronize gradients after each step
   - Best for: most models, moderate scale (up to 16 GPUs easily)
   - Complexity: easy

2. Tensor Parallelism
   - Split model weights across GPUs
   - Each GPU has a piece of the matrix
   - Best for: large models (70B+) on multiple GPUs
   - Complexity: moderate

3. Pipeline Parallelism
   - Split layers across GPUs (layer 1-10 on GPU 1, layer 11-20 on GPU 2)
   - Each GPU processes different layer at different time
   - Best for: very deep models on limited GPU memory
   - Complexity: high

4. Hybrid (Tensor + Pipeline + Data)
   - Combine all three
   - Best for: training massive models (100B+ tokens)
   - Complexity: extreme
   - Example: PaLM used 256 GPUs with tensor-pipeline-data parallelism

For most teams: Data Parallelism (FSDP) + Tensor Parallelism (Megatron)
This gets you to 70B models with 8-16 GPUs. That's where most people stop.
"""
```

### Checkpoint Strategy (Save What Matters)

```python
"""
Best practices for checkpointing:

1. Save every N steps (configurable, typically 500-2000)
   - Frequent saves: less data loss on crash
   - Infrequent saves: less disk I/O
   - Sweet spot: every 1000 steps for normal training, every 500 for unstable

2. Save best model (lowest validation loss) separately
   - Always keep the best checkpoint
   - Name it clearly: "best_model_step_5000.pt"

3. Use incremental checkpointing
   - Don't overwrite previous checkpoints
   - Keep last N checkpoints (or use checkpointing to save space

4. Use checkpoint compression (save as .tar.gz or bfloat16)
   - Reduces disk space by 2-4x
   - Minimal impact on training speed

5. Store checkpoints in object storage (S3, GCS, etc.)
   - Not on local disk
   - Local disk can fill up, corrupt, or disappear
   - Object storage survives hardware failure

Checkpointing checklist:
- [ ] Automatic checkpointing every N steps
- [ ] Best model saved separately
- [ ] Checkpoints stored in object storage
- [ ] Checkpoint compression enabled
- [ ] Resume from checkpoint works (test this!)
"""
```

### Practical Pipeline Example

```python
"""
Minimal training pipeline (what you need to build):

class TrainingPipeline:
    def __init__(self):
        self.data_manager = DVCManager()  # Version control
        self.experiment_tracker = MLflowTracker()  # Track experiments
        self.checkpoint_saver = CheckpointManager()  # Save checkpoints
        self.distributed_trainer = DDPTrainer()  # Train on multiple GPUs
    
    def run(self, config):
        # 1. Setup data
        train_data = self.data_manager.load("train-v12.3")
        val_data = self.data_manager.load("val-v12.3")
        
        # 2. Start experiment
        run = self.experiment_tracker.start_run(config)
        
        # 3. Train
        for epoch in range(config.epochs):
            train_loss = self.distributed_trainer.train(train_data)
            val_loss = self.distributed_trainer.validate(val_data)
            
            # Log metrics
            self.experiment_tracker.log_metrics(epoch, train_loss, val_loss)
            
            # Save checkpoint
            if epoch % 10 == 0:
                self.checkpoint_saver.save(
                    model=self.distributed_trainer.model,
                    epoch=epoch,
                    val_loss=val_loss
                )
        
        # 4. Final metrics
        final_metrics = self.distributed_trainer.evaluate(val_data)
        self.experiment_tracker.finish_run(final_metrics)
"""
```

### Summary

Training pipelines are infrastructure:
- **Data management**: Version control your data. DVC is the standard.
- **Experiment tracking**: MLflow for open-source, W&B for cloud.
- **Distributed training**: FSDP for most cases. Tensor + Pipeline for large models.
- **Checkpointing**: Every N steps, best model, object storage.

Build with reproducibility as the first priority. If you can't reproduce it, it didn't happen.
