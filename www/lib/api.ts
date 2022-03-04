const fetchAPI = async <T>(
  path: string,
  body: { [key: string]: any } | null = null
): Promise<T> => {
  const res = await fetch(
    `https://${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api${path}`,
    {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  const json = await res.json();
  if (json.error) {
    console.error(
      `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api${path}`,
      body,
      json.error
    );
    throw new Error('Failed to fetch API');
  }

  return json.data;
};

export async function getPreviewPostBySlug(slug: string) {
  const data = await fetchAPI<{ id: number; attributes: { Slug: string } }[]>(
    `/blogs?filters[Slug][$eq]=${slug}`
  );
  return data[0].attributes;
}

export async function getAllPostsWithSlug() {
  const data = await fetchAPI<{ id: number; attributes: { Slug: string } }[]>(
    '/blogs'
  );
  return data.map(item => item.attributes.Slug);
}

export async function getPostAndMorePosts(slug: string, preview: boolean) {
  const data = await fetchAPI<
    {
      id: number;
      attributes: { Title: string; Content: string; Slug: string };
    }[]
  >(`/blogs?filters[Slug][$eq]=${slug}`);
  return data[0].attributes;
}
