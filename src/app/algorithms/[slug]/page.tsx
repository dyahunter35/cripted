import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAlgorithmBySlug, allAlgorithms } from "@/content/algorithms";
import { AlgorithmLayout } from "@/components/algorithms/AlgorithmLayout";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return allAlgorithms.map((algo) => ({
    slug: algo.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const algo = getAlgorithmBySlug(slug);
  if (!algo) return { title: "الخوارزمية غير موجودة" };

  return {
    title: `خوارزمية ${algo.name} (${algo.subtitle}) — Crypto Lab`,
    description: algo.summary,
  };
}

export default async function AlgorithmPage({ params }: PageProps) {
  const { slug } = await params;
  const algo = getAlgorithmBySlug(slug);

  if (!algo) {
    notFound();
  }

  return <AlgorithmLayout algorithm={algo} />;
}
