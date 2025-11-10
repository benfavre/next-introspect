import { Code, Zap, FileText, Settings, Eye, GitBranch } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Next.js Project Introspection Tool
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          A comprehensive Next.js project introspection tool that analyzes
          routing structures, detects framework configurations, and provides
          detailed metadata about your Next.js application.
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="https://www.npmjs.com/package/next-introspect"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Install from npm
          </a>
          <a
            href="https://github.com/benfavre/next-introspect"
            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="mb-16">
        <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Code className="w-8 h-8 text-blue-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Framework Detection</h4>
            <p className="text-gray-600">
              Automatically detects Next.js projects and router types (App
              Router, Pages Router, or both)
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <FileText className="w-8 h-8 text-green-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Route Analysis</h4>
            <p className="text-gray-600">
              Comprehensive analysis of all routes including dynamic routes, API
              routes, and special pages
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Settings className="w-8 h-8 text-purple-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2">
              Multiple Output Formats
            </h4>
            <p className="text-gray-600">
              Export results as JavaScript objects, JSON, Markdown
              documentation, or TypeScript types
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Eye className="w-8 h-8 text-orange-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Analysis Modes</h4>
            <p className="text-gray-600">
              Choose between basic, detailed, or comprehensive analysis levels
              based on your needs
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <GitBranch className="w-8 h-8 text-red-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2">App Router Support</h4>
            <p className="text-gray-600">
              Full support for Next.js 13+ App Router with special files, route
              groups, and metadata
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Zap className="w-8 h-8 text-yellow-600 mb-4" />
            <h4 className="text-xl font-semibold mb-2">Watch Mode</h4>
            <p className="text-gray-600">
              Continuously monitors your project for changes and automatically
              re-analyzes when routes are modified
            </p>
          </div>
        </div>
      </div>

      {/* Installation */}
      <div id="installation" className="mb-16">
        <h3 className="text-3xl font-bold text-center mb-8">Installation</h3>
        <div className="bg-gray-900 text-white p-8 rounded-lg max-w-4xl mx-auto">
          <h4 className="text-xl font-semibold mb-4">
            Global Installation (CLI)
          </h4>
          <pre className="bg-gray-800 p-4 rounded mb-6">
            <code>npm install -g next-introspect</code>
          </pre>

          <h4 className="text-xl font-semibold mb-4">
            Local Installation (Programmatic)
          </h4>
          <pre className="bg-gray-800 p-4 rounded">
            <code>npm install next-introspect</code>
          </pre>
        </div>
      </div>

      {/* Usage */}
      <div id="usage" className="mb-16">
        <h3 className="text-3xl font-bold text-center mb-8">Quick Start</h3>
        <div className="bg-white p-8 rounded-lg shadow-sm border max-w-4xl mx-auto">
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2">
              Analyze your Next.js project:
            </h4>
            <pre className="bg-gray-100 p-4 rounded">
              <code>
                next-introspect introspect . --format typescript --output
                routes.ts
              </code>
            </pre>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-2">Use in your code:</h4>
            <pre className="bg-gray-100 p-4 rounded">
              <code>{`import { routes } from './routes';

const postUrl = routes.blog.posts.byId({ id: "123" });
// → "/blog/posts/123"`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* CLI Examples */}
      <div className="mb-16">
        <h3 className="text-3xl font-bold text-center mb-8">CLI Examples</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h4 className="text-lg font-semibold mb-4">Output Formats</h4>
            <pre className="bg-gray-100 p-4 rounded text-sm">
              <code>{`# Export as JSON
next-introspect introspect . --format json --output routes.json

# Generate Markdown documentation
next-introspect introspect . --format markdown --output ROUTES.md

# Generate TypeScript types for type-safe route access
next-introspect introspect . --format typescript --output routes.ts`}</code>
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h4 className="text-lg font-semibold mb-4">Analysis Modes</h4>
            <pre className="bg-gray-100 p-4 rounded text-sm">
              <code>{`# Basic analysis (fastest)
next-introspect introspect . --mode basic

# Detailed analysis (includes component types)
next-introspect introspect . --mode detailed

# Comprehensive analysis (includes all metadata)
next-introspect introspect . --mode comprehensive`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 border-t pt-8">
        <p>&copy; 2024 Next Introspect. Built by Webdesign29.</p>
        <div className="mt-4 flex justify-center space-x-6">
          <a
            href="https://github.com/benfavre/next-introspect"
            className="hover:text-gray-900"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/next-introspect"
            className="hover:text-gray-900"
          >
            npm
          </a>
        </div>
      </footer>
    </div>
  );
}
