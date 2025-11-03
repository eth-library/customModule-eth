export type Article = {
  fullTextFile: string
}
export interface ArticleLink {
  fulltext: string | null;
  fromLibkey: boolean;
  fromUnpaywall: boolean;
  type: string;
}