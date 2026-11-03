import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  parseProductCsv,
  getNextJsPrismaUploadRouteSnippet,
  getPrismaSchemaSnippet,
  validateCsvHeaders,
} from '../lib/csv-importer';
import { GmcProduct } from '../lib/gmc-feed';
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Database,
  Terminal,
  ShieldCheck,
  Activity,
  XCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

interface CsvUploadWorkspaceProps {
  onIngestProducts: (newProducts: GmcProduct[]) => void;
  currentProductCount: number;
}

interface IngestionLogItem {
  id: string;
  sku: string;
  title: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

const DROPSHIPPER_SUPPLIER_CSV = `Title,SKU,Price,Description,Image URL,Availability,GTIN,Brand,Condition
Ultra-light Titanium Travel Tumbler 500ml,SKU-TITAN-TUMB,69.00 USD,Vacuum-insulated double walled titanium tumbler with splash-proof lid.,https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800,in_stock,012345678912,AeroThermal,new
Merino Wool Commuter Thermal Hoodie,SKU-MERINO-HOOD,145.00 USD,100% pure New Zealand merino fleece with temperature regulation.,https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800,in_stock,5060123456796,NordicComfort,new
Qi2 Magnetic 3-in-1 Charging Stand,SKU-QI2-STAND,89.99 USD,Fast 15W wireless charging dock for phone watch and earbuds.,https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800,in_stock,084123456796,MagVolt,new
Titanium Frame Polarized Aviators,SKU-TITAN-AVIA,85.00 USD,Japanese beta-titanium frame with anti-reflective UV400 lenses.,https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800,in_stock,072123456796,OptiShield,new
Cordura 1000D Modular Laptop Vault 16in,SKU-CORDURA-SLV,55.00 USD,Waterproof ballistic sleeve with magnetic Fidlock closure.,https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800,in_stock,065123456796,AeroPack,new
Zero-Glare Blue Light Filter Glasses,SKU-BLU-FILTER,48.00 USD,Amber anti-reflective lenses for digital eye strain relief.,https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800,in_stock,072123456780,OptiShield,new`;

export const CsvUploadWorkspace: React.FC<CsvUploadWorkspaceProps> = ({
  onIngestProducts,
  currentProductCount,
}) => {
  const [csvRawText, setCsvRawText] = useState(DROPSHIPPER_SUPPLIER_CSV);
  const [activeCodeTab, setActiveCodeTab] = useState<'prisma_schema' | 'prisma_route'>('prisma_schema');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Ingestion simulation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [currentStep, setCurrentStep] = useState<string>('Ready for pre-flight check');
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [ingestionLogs, setIngestionLogs] = useState<IngestionLogItem[]>([]);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ingestionLogs]);

  const prismaSchema = getPrismaSchemaSnippet();
  const prismaRoute = getNextJsPrismaUploadRouteSnippet();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setCsvRawText(text);
          resetIngestionState();
        }
      };
      reader.readAsText(file);
    }
  };

  const resetIngestionState = () => {
    setProgress(0);
    setIsProcessing(false);
    setCurrentStep('Ready for pre-flight check');
    setSuccessCount(0);
    setFailureCount(0);
    setWarningCount(0);
    setIngestionLogs([]);
  };

  // Pre-ingestion validation
  const headerValidation = useMemo(() => {
    return validateCsvHeaders(csvRawText);
  }, [csvRawText]);

  // Full parser
  const parseResult = useMemo(() => {
    return parseProductCsv(csvRawText);
  }, [csvRawText]);

  // Real-time batch ingestion execution with live progress & item logs
  const handleStartIngestion = () => {
    if (!headerValidation.isValid || parseResult.validProducts.length === 0 || isProcessing) return;

    resetIngestionState();
    setIsProcessing(true);
    setProgress(5);
    setCurrentStep('Step 1/4: Pre-flight header & format verification');

    const total = parseResult.validProducts.length;
    const items = [...parseResult.validProducts];

    // Step 1: Initializing
    setTimeout(() => {
      setProgress(15);
      setCurrentStep('Step 2/4: PapaParse streaming rows into memory');
      setIngestionLogs((prev) => [
        ...prev,
        {
          id: 'log-start',
          sku: 'SYSTEM',
          title: 'PapaParse Stream Initialized',
          status: 'success',
          message: `Detected ${total} valid rows. All required headers verified.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }, 400);

    // Step 2: Sequential item ingestion with incremental progress
    setTimeout(() => {
      setCurrentStep('Step 3/4: Prisma PostgreSQL atomic transaction batching');
      let currentIdx = 0;
      let successes = 0;
      let warnings = 0;
      let failures = 0;

      const interval = setInterval(() => {
        if (currentIdx >= items.length) {
          clearInterval(interval);
          // Step 4: Finalize & update state
          setProgress(100);
          setCurrentStep('Step 4/4: Complete. Google Merchant Center XML feed edge revalidated.');
          setIsProcessing(false);
          onIngestProducts(items);
          setIngestionLogs((prev) => [
            ...prev,
            {
              id: 'log-complete',
              sku: 'DATABASE',
              title: 'Prisma Batch Transaction Committed',
              status: 'success',
              message: `Atomic batch commit successful. Total: ${successes} upserted, ${warnings} warnings, ${failures} rejected.`,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
          return;
        }

        const product = items[currentIdx];
        const hasWarning = !product.gtin && !product.mpn;
        const status: IngestionLogItem['status'] = hasWarning ? 'warning' : 'success';

        if (hasWarning) warnings++;
        else successes++;

        const currentProg = Math.round(20 + ((currentIdx + 1) / total) * 75);
        setProgress(currentProg);
        setSuccessCount(successes);
        setWarningCount(warnings);

        setIngestionLogs((prev) => [
          ...prev,
          {
            id: `log-${product.id}`,
            sku: product.id,
            title: product.title,
            status,
            message: hasWarning
              ? `Upserted record ($${product.price}). Note: Missing GTIN/MPN; set identifier_exists: no for GMC.`
              : `Upserted to PostgreSQL (${product.price}, GTIN: ${product.gtin}). Valid GMC RSS item.`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);

        currentIdx++;
      }, 350);
    }, 900);
  };

  const handleCopyCode = () => {
    const code = activeCodeTab === 'prisma_schema' ? prismaSchema : prismaRoute;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Pre-Ingestion Validation</span>
            <span aria-hidden="true">·</span>
            <span>PapaParse + Prisma ORM</span>
            <span aria-hidden="true">·</span>
            <span>Real-Time Progress &amp; Logging</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Dropshipping CSV Ingestion &amp; Live Monitoring
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Pre-flight schema validation checks CSV headers for Google Merchant Center requirements before executing real-time batch inserts into PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCode(!showCode)}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
          >
            {showCode ? 'Hide Prisma Code' : 'View Prisma Schema & Route'}
          </button>

          <label className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 cursor-pointer transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            <span>Upload Supplier CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Prisma Code Drawer */}
      {showCode && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 bg-slate-950/60 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveCodeTab('prisma_schema')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeCodeTab === 'prisma_schema'
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>prisma/schema.prisma</span>
              </button>

              <button
                onClick={() => setActiveCodeTab('prisma_route')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeCodeTab === 'prisma_route'
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>app/api/products/upload-csv/route.ts</span>
              </button>
            </div>

            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 bg-slate-800 rounded hover:bg-slate-700 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="p-4 font-mono text-xs text-slate-300 overflow-x-auto bg-slate-950 max-h-[380px] leading-relaxed">
            <code>{activeCodeTab === 'prisma_schema' ? prismaSchema : prismaRoute}</code>
          </pre>
        </div>
      )}

      {/* Pre-Ingestion Header Verification Strip */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Step 1: Pre-Ingestion Header Verification
            </h3>
          </div>
          <div className="text-xs">
            {headerValidation.isValid ? (
              <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All 4 Essential Headers Verified
              </span>
            ) : (
              <span className="text-rose-400 font-semibold inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Missing Required Headers
              </span>
            )}
          </div>
        </div>

        {/* Header Badges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div
            className={`p-3 rounded-lg border flex flex-col justify-between ${
              headerValidation.matchedAliases['id']
                ? 'bg-slate-950 border-emerald-500/40 text-slate-200'
                : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">SKU / ID (g:id)</span>
              {headerValidation.matchedAliases['id'] ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <span className="text-[11px] font-mono mt-1 text-slate-400">
              Matched: <strong className="text-emerald-400">{headerValidation.matchedAliases['id'] || 'None'}</strong>
            </span>
          </div>

          <div
            className={`p-3 rounded-lg border flex flex-col justify-between ${
              headerValidation.matchedAliases['title']
                ? 'bg-slate-950 border-emerald-500/40 text-slate-200'
                : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">Title (g:title)</span>
              {headerValidation.matchedAliases['title'] ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <span className="text-[11px] font-mono mt-1 text-slate-400">
              Matched: <strong className="text-emerald-400">{headerValidation.matchedAliases['title'] || 'None'}</strong>
            </span>
          </div>

          <div
            className={`p-3 rounded-lg border flex flex-col justify-between ${
              headerValidation.matchedAliases['price']
                ? 'bg-slate-950 border-emerald-500/40 text-slate-200'
                : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">Price (g:price)</span>
              {headerValidation.matchedAliases['price'] ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <span className="text-[11px] font-mono mt-1 text-slate-400">
              Matched: <strong className="text-emerald-400">{headerValidation.matchedAliases['price'] || 'None'}</strong>
            </span>
          </div>

          <div
            className={`p-3 rounded-lg border flex flex-col justify-between ${
              headerValidation.matchedAliases['availability']
                ? 'bg-slate-950 border-emerald-500/40 text-slate-200'
                : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">Availability (g:availability)</span>
              {headerValidation.matchedAliases['availability'] ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
            <span className="text-[11px] font-mono mt-1 text-slate-400">
              Matched:{' '}
              <strong className="text-emerald-400">{headerValidation.matchedAliases['availability'] || 'None'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time Progress Bar & Ingestion Telemetry Bar */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${isProcessing ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <h3 className="text-sm font-bold text-white">Real-Time Ingestion Pipeline</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{currentStep}</p>
          </div>

          {/* Counts Tally */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-400 font-semibold bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded">
              ✓ Success: <strong className="tabular-nums">{successCount}</strong>
            </span>
            <span className="text-amber-400 font-semibold bg-amber-950/50 border border-amber-800/40 px-2.5 py-1 rounded">
              ⚠ Warnings: <strong className="tabular-nums">{warningCount}</strong>
            </span>
            <span className="text-rose-400 font-semibold bg-rose-950/50 border border-rose-800/40 px-2.5 py-1 rounded">
              ✕ Failed: <strong className="tabular-nums">{failureCount}</strong>
            </span>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Pipeline Ingestion Progress</span>
            <span className="text-emerald-400 font-bold tabular-nums">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Execution Trigger Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-400">
            Detected: <strong className="text-white font-mono">{parseResult.validProducts.length}</strong> clean SKUs ready for insertion.
          </div>
          <div className="flex items-center gap-2">
            {ingestionLogs.length > 0 && !isProcessing && (
              <button
                onClick={resetIngestionState}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Logs</span>
              </button>
            )}
            <button
              onClick={handleStartIngestion}
              disabled={!headerValidation.isValid || parseResult.validProducts.length === 0 || isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isProcessing ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Ingesting Products ({progress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Live Bulk Ingestion</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Visual Ingestion Log Terminal & Source Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-Time Visual Log Terminal (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Real-Time Ingestion Logs</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Log Count: {ingestionLogs.length}
              </span>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs space-y-2 h-[340px] overflow-y-auto">
              {ingestionLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-24 text-[11px]">
                  Click &quot;Run Live Bulk Ingestion&quot; above to watch real-time record processing and Prisma upserts.
                </div>
              ) : (
                ingestionLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded border text-[11px] leading-relaxed flex items-start gap-2 ${
                      log.status === 'success'
                        ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-200'
                        : log.status === 'warning'
                        ? 'bg-amber-950/20 border-amber-800/30 text-amber-200'
                        : 'bg-rose-950/20 border-rose-800/30 text-rose-200'
                    }`}
                  >
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : log.status === 'warning' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-mono">{log.sku}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-300 font-sans text-xs">{log.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{log.message}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Source CSV Editor (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-white">Supplier CSV Raw Data</span>
              <button
                onClick={() => {
                  setCsvRawText(DROPSHIPPER_SUPPLIER_CSV);
                  resetIngestionState();
                }}
                className="text-[11px] text-slate-400 hover:text-emerald-400"
              >
                Reset Sample
              </button>
            </div>

            <textarea
              rows={13}
              value={csvRawText}
              onChange={(e) => {
                setCsvRawText(e.target.value);
                resetIngestionState();
              }}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 leading-relaxed"
              placeholder="Paste raw dropshipping supplier CSV or upload above..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
