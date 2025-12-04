import { crawlAndIndex, type CrawlerOptions, type CrawlerResult } from '@upstash/search-crawler';

const options: CrawlerOptions = {
  upstashUrl: 'UPSTASH_SEARCH_REST_URL',
  upstashToken: 'UPSTASH_SEARCH_REST_TOKEN',
  indexName: 'my-docs',
  docUrl: 'https://example.com/docs',
  silent: true // no console output
};

const result: CrawlerResult = await crawlAndIndex(options);