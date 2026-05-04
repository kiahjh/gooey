import React from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { HighlighterCore } from "shiki/core";

type MarkdownContentProps = {
  children: string;
  isStreaming?: boolean;
};

const MarkdownContent: React.FC<MarkdownContentProps> = ({
  children,
  isStreaming = false,
}) => {
  const components = React.useMemo(
    () => createMarkdownComponents(isStreaming),
    [isStreaming],
  );

  return (
    <div className="markdown-content">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  );
};

const createMarkdownComponents = (animateText: boolean): Components => ({
  a: ({ children, href }) => (
    <a href={href} rel="noreferrer" target="_blank">
      {animateText ? animateTextNodes(children, "a") : children}
    </a>
  ),
  code: Code,
  em: ({ children }) => (
    <em>{animateText ? animateTextNodes(children, "em") : children}</em>
  ),
  h1: ({ children }) => (
    <h1>{animateText ? animateTextNodes(children, "h1") : children}</h1>
  ),
  h2: ({ children }) => (
    <h2>{animateText ? animateTextNodes(children, "h2") : children}</h2>
  ),
  h3: ({ children }) => (
    <h3>{animateText ? animateTextNodes(children, "h3") : children}</h3>
  ),
  h4: ({ children }) => (
    <h4>{animateText ? animateTextNodes(children, "h4") : children}</h4>
  ),
  li: ({ children }) => (
    <li>{animateText ? animateTextNodes(children, "li") : children}</li>
  ),
  p: ({ children }) => (
    <p>{animateText ? animateTextNodes(children, "p") : children}</p>
  ),
  pre: Pre,
  strong: ({ children }) => (
    <strong>
      {animateText ? animateTextNodes(children, "strong") : children}
    </strong>
  ),
});

const animateTextNodes = (
  children: React.ReactNode,
  keyPrefix: string,
): React.ReactNode =>
  React.Children.map(children, (child, childIndex) => {
    const childKey = `${keyPrefix}-${childIndex}`;

    if (typeof child === "string") {
      return child.split(/(\s+)/).map((segment, segmentIndex) => {
        if (!segment) return null;
        if (/^\s+$/.test(segment)) return segment;

        return (
          <span
            key={`${childKey}-${segmentIndex}`}
            className="markdown-stream-token"
          >
            {segment}
          </span>
        );
      });
    }

    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) {
      return child;
    }

    if (child.type === "code" || child.type === Code) {
      return child;
    }

    return React.cloneElement(child, {
      children: animateTextNodes(child.props.children, childKey),
    });
  });

function Code({ children, className }: React.ComponentPropsWithoutRef<"code">) {
  return <code className={className ? className : "markdown-inline-code"}>{children}</code>;
}

function Pre({ children }: React.ComponentPropsWithoutRef<"pre">) {
  if (!React.isValidElement<React.ComponentPropsWithoutRef<"code">>(children)) {
    return <pre>{children}</pre>;
  }

  const { children: codeChildren, className } = children.props;
  const code = String(codeChildren).replace(/\n$/, "");
  const language = className?.match(/language-(\S+)/)?.[1];

  return <CodeBlock code={code} language={language} />;
}

type CodeBlockProps = {
  code: string;
  language?: string;
};

const shikiLanguageLoaders = {
  bash: () => import("shiki/langs/bash.mjs"),
  c: () => import("shiki/langs/c.mjs"),
  cpp: () => import("shiki/langs/cpp.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  shellscript: () => import("shiki/langs/shellscript.mjs"),
  toml: () => import("shiki/langs/toml.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
};

const shikiLanguageAliases: Record<string, keyof typeof shikiLanguageLoaders> = {
  "c++": "cpp",
  cc: "cpp",
  cjs: "javascript",
  cxx: "cpp",
  h: "c",
  hpp: "cpp",
  hxx: "cpp",
  js: "javascript",
  jsx: "jsx",
  md: "markdown",
  mts: "typescript",
  py: "python",
  rs: "rust",
  sh: "shellscript",
  shell: "shellscript",
  ts: "typescript",
  tsx: "tsx",
  yml: "yaml",
  zsh: "shellscript",
};

const loadedShikiLanguages = new Set<string>();
let highlighterPromise: Promise<HighlighterCore> | null = null;

const getHighlighter = () => {
  highlighterPromise ??= Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
    import("shiki/themes/github-dark-default.mjs"),
  ]).then(([core, engine, theme]) =>
    core.createHighlighterCore({
      engine: engine.createJavaScriptRegexEngine(),
      langs: [],
      themes: [theme.default],
    }),
  );

  return highlighterPromise;
};

const normalizeShikiLanguage = (language?: string) => {
  if (!language) return null;
  const normalized = language.toLowerCase();

  if (normalized in shikiLanguageLoaders) {
    return normalized as keyof typeof shikiLanguageLoaders;
  }

  return shikiLanguageAliases[normalized] ?? null;
};

const highlightCode = async (code: string, language?: string) => {
  const highlighter = await getHighlighter();
  const shikiLanguage = normalizeShikiLanguage(language);

  if (!shikiLanguage) return null;

  if (!loadedShikiLanguages.has(shikiLanguage)) {
    const languageModule = await shikiLanguageLoaders[shikiLanguage]();
    await highlighter.loadLanguage(languageModule.default);
    loadedShikiLanguages.add(shikiLanguage);
  }

  return highlighter.codeToHtml(code, {
    lang: shikiLanguage,
    theme: "github-dark-default",
  });
};

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = React.useState(false);
  const [highlightedCode, setHighlightedCode] = React.useState<string | null>(null);

  const copyCode = React.useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }, [code]);

  React.useEffect(() => {
    let cancelled = false;

    highlightCode(code, language)
      .then((html) => {
        if (!cancelled) setHighlightedCode(html);
      })
      .catch(() => {
        if (!cancelled) setHighlightedCode(null);
      });

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  return (
    <div className="markdown-code-block">
      <div className="markdown-code-block-header">
        <span>{language ?? "text"}</span>
        <button
          type="button"
          onClick={copyCode}
          aria-label={copied ? "Copied code" : "Copy code"}
        >
          {copied ? (
            <CheckIcon aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <CopyIcon aria-hidden="true" className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {highlightedCode ? (
        <div
          className="markdown-code-highlight"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      ) : (
        <pre>
          <code>
            {code.split("\n").map((line, index) => (
              <span className="line" key={index}>
                {line}
              </span>
            ))}
          </code>
        </pre>
      )}
    </div>
  );
};

export default MarkdownContent;
