"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useQcRuns, useLogQcRun } from "@/hooks/useQc";
import type {
  LJDataPoint,
  QcRunResponse,
  QcViolationSeverity,
  WestgardRule,
} from "@/types/qc";
import { WESTGARD_RULE_LABELS, WESTGARD_RULE_DESCRIPTIONS } from "@/types/qc";

// ── Helpers ──────────────────────────────────────────────────────────────────

function ViolationBadge({ severity }: { severity: QcViolationSeverity }) {
  return severity === "REJECT" ? (
    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
      REJECT
    </span>
  ) : (
    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
      WARNING
    </span>
  );
}

function ZScoreBadge({ zScore }: { zScore: number }) {
  const abs = Math.abs(zScore);
  const color =
    abs > 3 ? "bg-red-100 text-red-700" :
    abs > 2 ? "bg-amber-100 text-amber-700" :
    abs > 1 ? "bg-yellow-100 text-yellow-700" :
    "bg-green-100 text-green-700";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      z = {zScore.toFixed(2)}
    </span>
  );
}

// ── Levey-Jennings Chart ─────────────────────────────────────────────────────

function buildLJData(runs: QcRunResponse[]): LJDataPoint[] {
  // Show last 20 runs oldest-first for the chart
  return [...runs].reverse().slice(0, 20).map((r) => ({
    label:    format(new Date(r.runAt), "dd/MM HH:mm"),
    value:    Number(r.measuredValue),
    mean:     Number(r.targetMean),
    plus1sd:  Number(r.targetMean) + Number(r.targetSd),
    plus2sd:  Number(r.targetMean) + 2 * Number(r.targetSd),
    plus3sd:  Number(r.targetMean) + 3 * Number(r.targetSd),
    minus1sd: Number(r.targetMean) - Number(r.targetSd),
    minus2sd: Number(r.targetMean) - 2 * Number(r.targetSd),
    minus3sd: Number(r.targetMean) - 3 * Number(r.targetSd),
    hasViolation: r.violations.length > 0,
    violationSeverity: r.violations.length > 0
      ? (r.violations.some((v) => v.severity === "REJECT") ? "REJECT" : "WARNING")
      : undefined,
  }));
}

function LeveyJenningsChart({ runs, analyte, unit }: {
  runs: QcRunResponse[];
  analyte: string;
  unit?: string;
}) {
  const data = buildLJData(runs);
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        At least 2 runs needed to draw the chart.
      </div>
    );
  }

  const mean = data[0].mean;
  const sd   = runs[0]?.targetSd ? Number(runs[0].targetSd) : 0;
  const yLabel = unit ? `${analyte} (${unit})` : analyte;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis
          tickFormatter={(v) => v.toFixed(1)}
          label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11 }}
          tick={{ fontSize: 11 }}
          domain={[
            (min: number) => Math.min(min, mean - 3.5 * sd),
            (max: number) => Math.max(max, mean + 3.5 * sd),
          ]}
        />
        <Tooltip
          formatter={(value: number) => [value.toFixed(3), "Value"]}
          labelFormatter={(label) => `Run: ${label}`}
        />

        {/* Reference lines */}
        <ReferenceLine y={mean}           stroke="#6b7280" strokeWidth={1.5} label={{ value: "Mean", fontSize: 10, fill: "#6b7280" }} />
        <ReferenceLine y={mean + sd}      stroke="#86efac" strokeDasharray="4 2" />
        <ReferenceLine y={mean - sd}      stroke="#86efac" strokeDasharray="4 2" label={{ value: "±1SD", fontSize: 9, fill: "#86efac", position: "right" }} />
        <ReferenceLine y={mean + 2 * sd}  stroke="#fbbf24" strokeDasharray="4 2" />
        <ReferenceLine y={mean - 2 * sd}  stroke="#fbbf24" strokeDasharray="4 2" label={{ value: "±2SD", fontSize: 9, fill: "#fbbf24", position: "right" }} />
        <ReferenceLine y={mean + 3 * sd}  stroke="#f87171" strokeDasharray="4 2" />
        <ReferenceLine y={mean - 3 * sd}  stroke="#f87171" strokeDasharray="4 2" label={{ value: "±3SD", fontSize: 9, fill: "#f87171", position: "right" }} />

        {/* Control value line — dots turn red on violation */}
        <Line
          type="linear"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={(props) => {
            const pt = props.payload as LJDataPoint;
            const fill = pt.violationSeverity === "REJECT" ? "#ef4444"
              : pt.violationSeverity === "WARNING" ? "#f59e0b"
              : "#3b82f6";
            return <circle key={props.key} cx={props.cx} cy={props.cy} r={5} fill={fill} stroke="#fff" strokeWidth={1.5} />;
          }}
          activeDot={{ r: 7 }}
          name="Control value"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Log QC Run Form ──────────────────────────────────────────────────────────

function LogRunForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutateAsync: logRun, isPending } = useLogQcRun();
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    instrumentName: "",
    analyte: "",
    controlLevel: "NORMAL",
    measuredValue: "",
    targetMean: "",
    targetSd: "",
    runDate: today,
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const measuredValue = parseFloat(form.measuredValue);
    const targetMean    = parseFloat(form.targetMean);
    const targetSd      = parseFloat(form.targetSd);
    if (isNaN(measuredValue) || isNaN(targetMean) || isNaN(targetSd) || targetSd <= 0) {
      toast.error("Please enter valid numeric values. SD must be greater than 0.");
      return;
    }
    try {
      const result = await logRun({
        instrumentName: form.instrumentName.trim(),
        analyte:        form.analyte.trim(),
        controlLevel:   form.controlLevel,
        measuredValue,
        targetMean,
        targetSd,
        runDate:        form.runDate || undefined,
      });
      const violations = result.data?.violations ?? [];
      const rejects    = violations.filter((v) => v.severity === "REJECT");
      if (rejects.length > 0) {
        toast.error(`QC run logged — ${rejects.length} Westgard REJECT rule(s) violated. Publishing is blocked until resolved.`);
      } else if (violations.length > 0) {
        toast.warning("QC run logged — warning rule(s) fired. Monitor closely.");
      } else {
        toast.success("QC run logged — all Westgard rules passed.");
      }
      setForm({ instrumentName: "", analyte: "", controlLevel: "NORMAL", measuredValue: "", targetMean: "", targetSd: "", runDate: today });
      onSuccess();
    } catch {
      toast.error("Failed to log QC run");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Instrument *</label>
          <input
            value={form.instrumentName}
            onChange={set("instrumentName")}
            required
            placeholder="e.g. Mindray BS-240"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Analyte *</label>
          <input
            value={form.analyte}
            onChange={set("analyte")}
            required
            placeholder="e.g. Glucose"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Control Level *</label>
          <select
            value={form.controlLevel}
            onChange={set("controlLevel")}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Run Date *</label>
          <input
            type="date"
            value={form.runDate}
            onChange={set("runDate")}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Measured Value *</label>
          <input
            type="number"
            step="any"
            value={form.measuredValue}
            onChange={set("measuredValue")}
            required
            placeholder="e.g. 5.3"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Target Mean *</label>
            <input
              type="number"
              step="any"
              value={form.targetMean}
              onChange={set("targetMean")}
              required
              placeholder="e.g. 5.1"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Target SD *</label>
            <input
              type="number"
              step="any"
              value={form.targetSd}
              onChange={set("targetSd")}
              required
              placeholder="e.g. 0.2"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Logging…" : "Log QC Run"}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function QcPage() {
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [instrumentFilter, setInstrumentFilter] = useState("");
  const [analyteFilter, setAnalyteFilter] = useState("");
  const [selectedRun, setSelectedRun] = useState<QcRunResponse | null>(null);

  const { data, isLoading } = useQcRuns(page, 20, instrumentFilter, analyteFilter);
  const runs    = data?.content ?? [];
  const total   = data?.totalElements ?? 0;
  const pages   = data?.totalPages ?? 1;

  // For the L-J chart: filter to same instrument+analyte+level as selected run
  const chartRuns = selectedRun
    ? runs.filter(
        (r) =>
          r.instrumentName === selectedRun.instrumentName &&
          r.analyte         === selectedRun.analyte &&
          r.controlLevel    === selectedRun.controlLevel
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">QC Runs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Log daily instrument QC control runs and monitor Westgard rule violations.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Log QC Run"}
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">New QC Control Run</h2>
          <LogRunForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {/* Levey-Jennings chart (shown when a run is selected) */}
      {selectedRun && chartRuns.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">
                Levey-Jennings Chart
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedRun.instrumentName} · {selectedRun.analyte} · {selectedRun.controlLevel}
              </p>
            </div>
            <button
              onClick={() => setSelectedRun(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Close chart
            </button>
          </div>
          <div className="text-xs text-gray-400 flex gap-4 mb-2">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-green-400"></span>±1 SD</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-amber-400"></span>±2 SD</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-red-400"></span>±3 SD</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-red-500 rounded-full"></span>Reject</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-amber-500 rounded-full"></span>Warning</span>
          </div>
          <LeveyJenningsChart runs={chartRuns} analyte={selectedRun.analyte} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <input
          value={instrumentFilter}
          onChange={(e) => { setInstrumentFilter(e.target.value); setPage(0); }}
          placeholder="Filter by instrument…"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none w-56"
        />
        <input
          value={analyteFilter}
          onChange={(e) => { setAnalyteFilter(e.target.value); setPage(0); }}
          placeholder="Filter by analyte…"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none w-56"
        />
      </div>

      {/* Runs table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">QC Control Runs ({total})</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No QC runs logged yet. Click &quot;+ Log QC Run&quot; to get started.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                {["Date", "Instrument", "Analyte", "Level", "Value", "Mean ± SD", "z-Score", "Rules Fired", ""].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.map((run) => {
                const hasReject  = run.violations.some((v) => v.severity === "REJECT");
                const hasWarning = run.violations.some((v) => v.severity === "WARNING");
                const rowBg      = hasReject ? "bg-red-50" : hasWarning ? "bg-amber-50" : "";
                const isSelected = selectedRun?.id === run.id;
                return (
                  <tr key={run.id} className={`${rowBg} ${isSelected ? "ring-2 ring-inset ring-blue-400" : ""}`}>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {format(new Date(run.runAt), "dd MMM yyyy, HH:mm")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{run.instrumentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{run.analyte}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{run.controlLevel}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">{Number(run.measuredValue).toFixed(3)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono whitespace-nowrap">
                      {Number(run.targetMean).toFixed(2)} ± {Number(run.targetSd).toFixed(3)}
                    </td>
                    <td className="px-4 py-3">
                      <ZScoreBadge zScore={run.zScore} />
                    </td>
                    <td className="px-4 py-3">
                      {run.violations.length === 0 ? (
                        <span className="text-xs text-green-600">✓ Pass</span>
                      ) : (
                        <div className="space-y-1">
                          {run.violations.map((v) => (
                            <div key={v.id} className="flex items-center gap-1.5 flex-wrap">
                              <ViolationBadge severity={v.severity} />
                              <span
                                title={WESTGARD_RULE_DESCRIPTIONS[v.rule as WestgardRule]}
                                className="text-xs text-gray-700 cursor-help underline decoration-dotted"
                              >
                                {WESTGARD_RULE_LABELS[v.rule as WestgardRule] ?? v.rule}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedRun(isSelected ? null : run)}
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                      >
                        {isSelected ? "Hide chart" : "View chart"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">Page {page + 1} of {pages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded border px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={page >= pages - 1}
                className="rounded border px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Westgard rules reference card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Westgard Multi-Rules Reference</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.entries(WESTGARD_RULE_DESCRIPTIONS) as [WestgardRule, string][]).map(([rule, desc]) => (
            <div key={rule} className="flex gap-2 text-xs text-gray-600">
              <span className="shrink-0 font-semibold text-gray-800 w-20">
                {WESTGARD_RULE_LABELS[rule].split(" ")[0]}
              </span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
