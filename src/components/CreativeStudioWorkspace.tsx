import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Download, RefreshCw, AlertCircle, CheckCircle2, Layers } from 'lucide-react';

export const CreativeStudioWorkspace: React.FC = () => {
  const [prompt, setPrompt] = useState(
    'Studio product photography of an ultra-lightweight grade 1 titanium thermal travel flask on a clean neutral travertine surface, soft diffused side lighting, shallow depth of field, commercial luxury aesthetic, minimalist packaging.'
  );
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '16:9' | '9:16'>('1:1');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const presets = [
    {
      label: 'Travertine Luxury',
      prompt:
        'Studio product photography of [product] on a clean neutral travertine surface, soft diffused side lighting, shallow depth of field, 8k commercial quality, minimalist luxury aesthetic.',
    },
    {
      label: 'GMC Pure White Background',
      prompt:
        'Commercial catalog photography of [product] centered on a pure seamless white background (#ffffff), zero harsh shadows, even diffused studio illumination, Google Shopping compliant.',
    },
    {
      label: 'Commuter Lifestyle (US/UK)',
      prompt:
        'Cinematic lifestyle in-situ photography of [product] in an urban modern commuter transit environment, soft natural morning window light, high aesthetic craft.',
    },
    {
      label: 'Tactile Macro Detail',
      prompt:
        'Extreme macro close-up product shot focusing on the brushed metallic texture and precision laser-etched branding of [product], studio rim lighting, tactile luxury.',
    },
  ];

  const handleApplyPreset = (presetPrompt: string) => {
    setPrompt(presetPrompt.replace('[product]', 'a CNC aerospace titanium travel tumbler'));
  };

  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setErrorMsg(null);
    setFeedbackNotice(null);

    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageSize,
          aspectRatio,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate product visual.');
      }

      setGeneratedImage(data.imageUrl);
      setModelUsed(data.modelUsed || 'gemini-3-pro-image-preview');
      if (data.isNotice || data.textFeedback) {
        setFeedbackNotice(data.textFeedback);
      }
    } catch (err: any) {
      console.error('[Creative Studio Notice]:', err);
      setErrorMsg(err.message || 'Image generation notice. Free Tier keys have limit 0 for neural image models.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `product-creative-${imageSize.toLowerCase()}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Model: gemini-3-pro-image-preview</span>
            <span aria-hidden="true">·</span>
            <span>Resolution: 1K / 2K / 4K</span>
            <span aria-hidden="true">·</span>
            <span>Commercial Ad Creatives</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            High-Resolution Product Creative Studio
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Synthesize high-fidelity e-commerce imagery and Google Merchant Center compliant white-background assets powered by <code className="text-emerald-400 font-mono text-xs">gemini-3-pro-image-preview</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            {/* Resolution Selector (Affordance for 1K, 2K, 4K) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target Image Resolution
                </label>
                <span className="text-[11px] font-mono text-emerald-400">{imageSize} UHD</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['1K', '2K', '4K'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setImageSize(size)}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                      imageSize === size
                        ? 'bg-slate-800 border-emerald-400 text-emerald-400 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{size}</span>
                    <span className="block text-[10px] font-normal text-slate-500">
                      {size === '1K' ? '1024×1024' : size === '2K' ? '2048×2048' : '4096×4096'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(['1:1', '4:3', '16:9', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 px-2 text-center rounded border font-mono text-xs transition-colors ${
                      aspectRatio === ratio
                        ? 'bg-slate-800 border-emerald-400 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt presets */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                Lighting &amp; Studio Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset.prompt)}
                    className="text-[11px] px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Creative Generation Prompt
              </label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe lighting, camera focal length, surface texture, and product angles..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 leading-relaxed"
              />
            </div>

            {/* Generate CTA */}
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg hover:bg-emerald-300 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing {imageSize} Visual...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Creative Asset ({imageSize})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 min-h-[460px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Asset Canvas</span>
                {modelUsed && (
                  <span className="text-[10px] font-mono text-emerald-400 border border-slate-800 px-1.5 py-0.5 rounded">
                    {modelUsed}
                  </span>
                )}
              </div>

              {generatedImage && (
                <button
                  onClick={handleDownloadImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {imageSize} PNG</span>
                </button>
              )}
            </div>

            {/* Image display surface */}
            <div className="my-auto py-4 flex items-center justify-center">
              {generatedImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-[380px] shadow-2xl">
                  <img
                    src={generatedImage}
                    alt="Generated Product Creative"
                    className="max-h-[380px] w-auto object-contain"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur rounded font-mono text-[10px] text-emerald-400">
                    {imageSize} · {aspectRatio}
                  </div>
                </div>
              ) : loading ? (
                <div className="text-center space-y-3 py-16">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-300 font-medium">
                    Rendering photo-realistic lighting and physical materials with {imageSize} precision...
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">gemini-3-pro-image-preview</p>
                </div>
              ) : (
                <div className="text-center space-y-3 py-16 text-slate-500">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Ready to Render Product Assets</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      Select your resolution (1K, 2K, or 4K), choose a studio preset, and click Generate to produce high-converting commercial creatives.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {feedbackNotice && (
              <div className="p-3 bg-slate-950/80 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Commercial Asset Ready ({imageSize} UHD)</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{feedbackNotice}</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Notice</p>
                  <p className="mt-0.5 text-[11px]">{errorMsg}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
