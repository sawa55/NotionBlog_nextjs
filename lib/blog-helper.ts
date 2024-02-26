//*タグに基づいた投稿のページリンクか、タグを指定しない一般的な投稿のページリンクを生成
export const getPageLink = (tag: string, page: number) => {
  return tag ? `/posts/tag/${tag}/page/${page}` : `/posts/page/${page}`;
};
