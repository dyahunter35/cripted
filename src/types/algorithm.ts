export interface AlgorithmSpec {
  blockSize: string;
  keySize: string;
  structure: string;
  rounds: string;
  securityStatus: "strong" | "insecure" | "academic" | "historical";
  securityLabel: string;
  designer: string;
  year: number;
  standard: string;
}

export interface TheorySection {
  id: string;
  title: string;
  icon?: string;
  htmlContent: string;
}

export interface CodeTabItem {
  id: string;
  title: string;
  language: "python" | "javascript";
  category: "manual" | "libs" | "interactive" | "stego";
  fileName: string;
  description: string;
  code: string;
}

export interface AlgorithmData {
  slug: string;
  name: string;
  subtitle: string;
  category: "core" | "additional";
  summary: string;
  heroPill: string;
  specs: AlgorithmSpec;
  theory: TheorySection[];
  playgroundType: string;
  downloadZip: string;
  codeTabs: CodeTabItem[];
  defaultKey: string;
  defaultPlaintext: string;
}
