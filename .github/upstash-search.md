import { Search } from "@upstash/search";

const client = Search.fromEnv();

const index = client.index("movies");

const searchResults = await index.search({
  query: "space opera",
  limit: 2,
  filter: "genre = 'sci-fi'",
  reranking: true,
});
