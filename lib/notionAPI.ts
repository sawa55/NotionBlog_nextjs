import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { NUMBER_OF_POSTS_PER_PAGE } from "../constants/constants";

//* Notion APIクライアントの初期化
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

//* NotionToMarkdownクラスの初期化
const n2m = new NotionToMarkdown({ notionClient: notion });
// console.log(NotionToMarkdown);

// console.log(n2m);

//* Notionのデータベースから全ての記事を取得
export const getAllPosts = async () => {

  const posts = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    page_size: 100,
    filter: {
      property: "Published",
      checkbox: {
        equals: true,
      },
    },
    sorts: [
      {
        property: "Date",
        direction: "descending",
      },
    ],
  });


  //*resultsは配列
  const allPosts = posts.results;

  return allPosts.map((post) => {
    return getPageMetaData(post);
  });
};


//*投稿からタグとメタデータを取得　
const getPageMetaData = (post) => {
  const getTags = (tags) => {
    const allTags = tags.map((tag) => {
      return tag.name;
    });

    return allTags;
  };
  //*post.propertiesの中には、Name, Description, Date, Slug, Tagsが含まれている
  return {
    id: post.id,
    title: post.properties.Name.title[0].plain_text,
    description: post.properties.Description.rich_text[0].plain_text,
    date: post.properties.Date.date.start,
    slug: post.properties.Slug.rich_text[0].plain_text,
    tags: getTags(post.properties.Tags.multi_select),
  };

};


//*特定のスラッグに一致する記事を検索、その記事のメタデータとマークダウンを取得する関数を作成
export const getSinglePost = async (slug) => {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    filter: {
      property: "Slug",
      formula: {
        string: {
          equals: slug,
        },
      },
    },
  });
  const page = response.results[0];
  const metadata = getPageMetaData(page);
  // console.log(metadata);
  //*pageToMarkdownやtoMarkdownStringはNotionToMarkdownクラスのメソッド
  const mdBlocks = await n2m.pageToMarkdown(page.id);
  const mdString = n2m.toMarkdownString(mdBlocks);
  // console.log(mdString);

  return {
    metadata,
    markdown: mdString,
  };
};

//* Topページ用記事の取得(4つ) 
export const getPostsForTopPage = async (pageSize: number) => {
  const allPosts = await getAllPosts();
  const fourPosts = allPosts.slice(0, pageSize);
  return fourPosts;
};

//* ページ番号に応じた記事取得 
export const getPostsByPage = async (page: number) => {
  const allPosts = await getAllPosts();

  const startIndex = (page - 1) * NUMBER_OF_POSTS_PER_PAGE;
  const endIndex = startIndex + NUMBER_OF_POSTS_PER_PAGE;

  return allPosts.slice(startIndex, endIndex);
};

//*ページネーションを実装するためのページ数を計算
export const getNumberOfPages = async () => {
  const allPosts = await getAllPosts();

  return (
    Math.floor(allPosts.length / NUMBER_OF_POSTS_PER_PAGE) +
    (allPosts.length % NUMBER_OF_POSTS_PER_PAGE > 0 ? 1 : 0)
  );
};

//*特定のタグ名に基づいてフィルタリングされ、
//*かつ指定されたページ番号に応じてページネーションされた投稿のリストを取得する非同期関数
export const getPostsByTagAndPage = async (tagName: string, page: number) => {
  const allPosts = await getAllPosts();
  const posts = allPosts.filter((post) =>
    post.tags.find((tag: string) => tag === tagName)
  );

  const startIndex = (page - 1) * NUMBER_OF_POSTS_PER_PAGE;
  const endIndex = startIndex + NUMBER_OF_POSTS_PER_PAGE;

  return posts.slice(startIndex, endIndex);
};

//*特定のタグ名に基づいてフィルタリングされた投稿の総数を元に、ページネーションに必要なページ数を計算
export const getNumberOfPagesByTag = async (tagName: string) => {
  const allPosts = await getAllPosts();
  const posts = allPosts.filter((post) =>
    post.tags.find((tag: string) => tag === tagName)
  );

  return (
    Math.floor(posts.length / NUMBER_OF_POSTS_PER_PAGE) +
    (posts.length % NUMBER_OF_POSTS_PER_PAGE > 0 ? 1 : 0)
  );
};

//*Notionデータベースから取得した全ての投稿に含まれるタグの一覧を重複なしで取得する
export const getAllTags = async () => {
  const allPosts = await getAllPosts();

  //?flatMapは配列の各要素に対して与えられた関数を呼び出し、結果をフラット化した新しい配列を生成
  const allTagsDuplicationLists = allPosts.flatMap((post) => post.tags);
  //?Setオブジェクトは、重複する値を格納し、重複を除去する
  const set = new Set(allTagsDuplicationLists);
  //?重複のないタグを配列に変換
  const allTagsList = Array.from(set);
  // console.log(allTagsList);

  return allTagsList;
};

