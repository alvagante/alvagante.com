FROM ruby:3.3-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential git pkg-config \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /srv/jekyll

ENV BUNDLE_PATH=/bundle \
  BUNDLE_JOBS=4 \
  BUNDLE_RETRY=3 \
  JEKYLL_ENV=development

COPY Gemfile ./
RUN bundle install

EXPOSE 4000 35729

CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--port", "4000", "--livereload", "--incremental"]
