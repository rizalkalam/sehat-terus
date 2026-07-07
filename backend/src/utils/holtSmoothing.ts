/**
 * Holt's linear trend method (double exponential smoothing).
 * Fits alpha/beta via grid search minimizing one-step-ahead SSE, then
 * projects `horizon` steps beyond the last observed point.
 */
export interface HoltResult {
  fitted: number[];
  forecast: number[];
  alpha: number;
  beta: number;
}

function runHolt(series: number[], alpha: number, beta: number): { fitted: number[]; level: number; trend: number } {
  const level = [series[0]];
  const trend = [series.length > 1 ? series[1] - series[0] : 0];
  const fitted = [series[0]];

  for (let t = 1; t < series.length; t++) {
    const prevLevel = level[t - 1];
    const prevTrend = trend[t - 1];
    const newLevel = alpha * series[t] + (1 - alpha) * (prevLevel + prevTrend);
    const newTrend = beta * (newLevel - prevLevel) + (1 - beta) * prevTrend;
    level.push(newLevel);
    trend.push(newTrend);
    fitted.push(prevLevel + prevTrend);
  }

  return { fitted, level: level[level.length - 1], trend: trend[trend.length - 1] };
}

export function holtForecast(series: number[], horizon: number): HoltResult {
  if (series.length === 0) {
    return { fitted: [], forecast: Array(horizon).fill(0), alpha: 0, beta: 0 };
  }
  if (series.length < 2) {
    const flat = series[0];
    return { fitted: [flat], forecast: Array(horizon).fill(Math.max(0, Math.round(flat))), alpha: 0, beta: 0 };
  }

  let best: { alpha: number; beta: number; sse: number } | null = null;
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      const alpha = a / 10;
      const beta = b / 10;
      const { fitted } = runHolt(series, alpha, beta);
      let sse = 0;
      for (let t = 1; t < series.length; t++) {
        const err = series[t] - fitted[t];
        sse += err * err;
      }
      if (!best || sse < best.sse) best = { alpha, beta, sse };
    }
  }

  const { alpha, beta } = best!;
  const { fitted, level, trend } = runHolt(series, alpha, beta);
  const forecast = Array.from({ length: horizon }, (_, i) => Math.max(0, Math.round(level + (i + 1) * trend)));

  return { fitted, forecast, alpha, beta };
}
