import { serialize } from "next-mdx-remote/serialize";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrismPlus from "rehype-prism-plus";
import remarkGfm from "remark-gfm";

const rehypeAutolinkHeadingsOptions = {
  behavior: "wrap" as const,
  properties: { className: ["anchor"] },
};

export const mdxSerializeOptions = {
  parseFrontmatter: false,
  mdxOptions: {
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, rehypeAutolinkHeadingsOptions],
      [rehypePrismPlus, { ignoreMissing: true }],
    ],
    remarkPlugins: [remarkGfm],
  },
};

export async function serializeMdx(content: string) {
  // Plugin tuple types from rehype/remark are strict; options are valid at runtime
  return serialize(content, mdxSerializeOptions as Parameters<typeof serialize>[1] & object);
}
