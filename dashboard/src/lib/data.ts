import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "public", "data");

const cache = new Map<string, unknown>();

export async function loadJSON<T>(name: string): Promise<T> {
  if (cache.has(name)) return cache.get(name) as T;
  const file = path.join(DATA_DIR, name);
  const raw = await fs.readFile(file, "utf-8");
  const data = JSON.parse(raw) as T;
  cache.set(name, data);
  return data;
}

// ──────────────── Types ────────────────

export type FinancialRatio = {
  corp_code: string;
  corp_name: string;
  bsns_year: number;
  debt_ratio: number;
  current_ratio: number;
  roe: number;
  roa: number;
  interest_coverage: number;
  operating_margin: number;
  altman_z: number;
  altman_zone: string;
  health_score: number;
  health_grade: string;
  log_assets: number;
  revenue?: number;
  total_assets?: number;
  net_income?: number;
  operating_income?: number;
  total_equity?: number;
  total_liabilities?: number;
};

export type SectorCluster = FinancialRatio & {
  induty_code: number;
  cluster: number;
  pca_1: number;
  pca_2: number;
};

export type HealthScore = {
  corp_code: string;
  corp_name: string;
  bsns_year: number;
  health_score: number;
  health_grade: string;
  altman_z: number;
  altman_zone: string;
};

export type AnomalyFlag = {
  corp_code: string;
  corp_name: string;
  bsns_year: number;
  risk: number;
  anomaly_votes: number;
  anomaly_flag: number;
};

export type CrossPhaseRow = {
  corp_code: string;
  corp_name: string;
  bsns_year: number;
  health_score: number;
  health_grade: string;
  altman_zone: string;
  cluster: number;
  risk: number;
  anomaly_votes: number;
};

export type LeaderboardP1 = {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  auc_roc: number;
  train_time_sec: number;
};

export type LeaderboardP2 = {
  model: string;
  n_clusters: number;
  n_noise: number;
  silhouette: number;
  calinski_harabasz: number;
  davies_bouldin: number;
};

export type LeaderboardP3 = {
  model: string;
  n_anomalies: number;
  anomaly_rate: number;
  precision: number;
  recall: number;
};

export type LeaderboardP4 = {
  model: string;
  rmse: number;
  mae: number;
  mape: number;
  train_time_sec: number;
};

export type DisclosureMonthly = { year_month: string; count: number };

export type Forecast = {
  year_month: string;
  actual: number;
  arima: number;
  prophet: number;
  lstm: number;
  gru: number;
  transformer: number;
};

export type Decomposition = {
  year_month: string;
  observed: number;
  trend: number;
  seasonal: number;
  residual: number;
};

export type BenfordRow = {
  column: string;
  digit: number;
  expected_prop: number;
  actual_prop: number;
  expected_count: number;
  actual_count: number;
  chi2: number;
  p_value: number;
  conforms: boolean;
};

export type BenfordSuspicious = {
  corp_code: string;
  corp_name: string;
  bsns_year: number;
  n_digits: number;
  kl_divergence: number;
};

export type ClusterCentroid = {
  cluster: number;
  label: string;
  size: number;
  debt_ratio: number;
  current_ratio: number;
  roe: number;
  roa: number;
  interest_coverage: number;
  operating_margin: number;
  altman_z: number;
  health_score: number;
  log_assets: number;
};

export type ClusterLabels = Record<
  string,
  {
    label: string;
    size: number;
    representatives: Array<{
      corp_code: string;
      corp_name: string;
      health_score: number;
      altman_zone: string;
    }>;
    centroid: Record<string, number>;
  }
>;

export type CrossPhaseSummary = {
  crosstabs: Record<string, unknown>;
  sankey: {
    nodes: Array<{ name: string }>;
    links: Array<{ source: number; target: number; value: number }>;
  };
  insights: string[];
};

export type ModelsCatalog = Record<
  string,
  {
    title: string;
    task: string;
    validation: string;
    [key: string]: unknown;
    models: Array<{
      id: string;
      library: string;
      params: string;
      file: string;
    }>;
  }
>;

export type DatasetCatalog = Array<{
  name: string;
  description: string;
  source: string;
  rows: number;
  columns: string[];
  n_columns: number;
  missing_rate: number;
  sample: Array<Record<string, unknown>>;
}>;

export type Meta = {
  generated_at: string;
  project_root: string;
  n_companies: number;
  n_models: number;
  n_disclosures: number;
  data_source: string;
};

export type DisclosureSummary = {
  total: number;
  by_year_month: Array<{ ym: string; count: number }>;
  by_report_type: Record<string, number>;
  by_corp: Array<{ corp_code: string; corp_name: string; count: number }>;
};

export type DisclosureTimeline = Record<
  string,
  Array<{ rcept_dt: string; report_nm: string; report_type: string }>
>;
