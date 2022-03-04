import type { NextPage, GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { getAllPostsWithSlug, getPostAndMorePosts } from '../../lib/api';
import { markdownToHtml } from '../../lib/markdown';

interface BlogEntry {
  Slug: string;
  Title: string;
  Content: string;
}

const Post: NextPage<{ preview: boolean | null; post: BlogEntry }> = ({
  preview,
  post,
}) => {
  const { Title: title, Content: content } = post;

  return (
    <div>
      <Head>
        <title>{title}</title>
      </Head>

      <h1>{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
}) => {
  const data = await getPostAndMorePosts(params?.slug as string, preview);
  const content = await markdownToHtml(data?.Content || '');

  return {
    props: {
      preview,
      post: {
        ...data,
        Content: content,
      },
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getAllPostsWithSlug();
  return {
    paths: slugs?.map(slug => `/blog/${slug}`) || [],
    fallback: true,
  };
};

export default Post;
