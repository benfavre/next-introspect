import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  // Placeholder page - docs functionality to be implemented
  const title = slug.join(" / ");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">Documentation</h1>
      <p className="text-lg text-gray-600">Page: {title}</p>
      <p className="mt-4 text-gray-500">
        Documentation content would be displayed here.
      </p>
    </div>
  );
}

export async function generateStaticParams() {
  // Return basic documentation pages
  return [
    { slug: ["getting-started"] },
    { slug: ["api"] },
    { slug: ["cli"] },
    { slug: ["usage", "watch-mode"] },
    { slug: ["features", "analysis-modes"] },
    { slug: ["features", "output-formats"] },
    { slug: ["features", "typescript-output"] },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const title = slug.join(" > ");

  return {
    title: `${title} | Next Introspect Docs`,
    description: `Documentation for Next Introspect: ${title}`,
  };
}
