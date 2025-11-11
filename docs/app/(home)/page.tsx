import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 border border-gray-200 bg-gray-50 text-gray-700 text-sm font-medium mb-6">
              Next.js Introspection Tool
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8 tracking-tight">
              Analyze Your Next.js
              <br />
              <span className="text-gray-600">Routing Structure</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              A comprehensive Next.js project introspection tool that analyzes
              routing structures, detects framework configurations, and provides
              detailed metadata about your Next.js application.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/docs"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-black hover:bg-gray-800 transition-colors"
              >
                Get Started
              </Link>
              <a
                href="https://github.com/benfavre/next-introspect"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-200 hover:border-gray-400 transition-colors"
              >
                View on GitHub
              </a>
            </div>

            {/* Quick Demo */}
            <div className="bg-gray-900 text-white border border-gray-800 p-8 max-w-4xl mx-auto font-mono text-sm">
              <div className="flex items-center mb-4">
                <span className="text-gray-400">$</span>
                <span className="ml-3 text-gray-200">
                  next-introspect introspect . --format typescript --output
                  routes.ts
                </span>
              </div>
              <div className="text-left border-t border-gray-700 pt-4">
                <div className="text-green-400 font-medium mb-3">
                  ✅ Analysis complete!
                </div>
                <div className="text-gray-300 mb-4">
                  Generated type-safe route helpers for your Next.js project
                </div>
                <div className="bg-gray-800 border border-gray-700 p-4 text-xs overflow-x-auto">
                  <div className="text-blue-300 mb-2">
                    {/* routes.ts - Auto-generated */}
                  </div>
                  <div className="text-gray-200">
                    export const routes = &#123;
                  </div>
                  <div className="text-gray-200 ml-4">
                    blog: &#123; $slug: (params) =&gt;
                  </div>
                  <div className="text-gray-200 ml-8">
                    `/blog/&#36;&#123;params.slug&#125;` &#125;,
                  </div>
                  <div className="text-gray-200 ml-4">
                    api: &#123; users: "/api/users" &#125;
                  </div>
                  <div className="text-gray-200">&#125; as const;</div>
                  <div className="text-gray-400 mt-2">
                    {/* Use in your code: */}
                  </div>
                  <div className="text-gray-200">
                    routes.blog.$slug(&#123; slug: 'my-post' &#125;)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to understand, document, and work with your
              Next.js routing structure with enterprise-grade reliability
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 border border-gray-200 hover:border-gray-300 transition-colors group">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center mb-6 text-2xl font-bold">
                A
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                App Router Support
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Full support for Next.js 13+ App Router with special files,
                route groups, intercepting routes, and parallel routes. Analyzes
                layouts, loading states, error boundaries, and metadata exports.
              </p>
              <div className="bg-gray-50 p-3 font-mono text-xs text-gray-700 mb-3">
                <div className="text-blue-600 mb-1">
                  app/(dashboard)/page.tsx
                </div>
                <div>export default function Dashboard() {"{"}...</div>
              </div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Next.js 13+
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 border border-gray-200 hover:border-gray-300 transition-colors group">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center mb-6 text-2xl font-bold">
                P
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Pages Router Legacy
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Complete analysis of traditional Pages Router with API routes,
                data fetching methods (getServerSideProps, getStaticProps), and
                special pages (_app, _document, _error).
              </p>
              <div className="bg-gray-50 p-3 font-mono text-xs text-gray-700 mb-3">
                <div className="text-blue-600 mb-1">pages/api/users.ts</div>
                <div>export default function handler(req, res) {"{"}...</div>
              </div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Legacy Support
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 border border-gray-200 hover:border-gray-300 transition-colors group">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center mb-6 text-2xl font-bold">
                T
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Type-Safe Routes
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Generate TypeScript route builders with full type safety. Enjoy
                IDE autocompletion, compile-time route validation, and zero
                runtime errors in your route usage.
              </p>
              <div className="bg-gray-50 p-3 font-mono text-xs text-gray-700 mb-3">
                <div className="text-blue-600 mb-1">
                  {/* Type-safe route usage */}
                </div>
                <div>routes.blog.$slug(&#123; slug: 'my-post' &#125;)</div>
                <div className="text-gray-500">{/* → "/blog/my-post" */}</div>
              </div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                TypeScript 5.0+
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 border border-gray-200 hover:border-gray-300 transition-colors group">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center mb-6 text-2xl font-bold">
                W
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Watch Mode
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Real-time monitoring with intelligent file watching.
                Automatically re-analyzes routes when you add pages, update
                configurations, or modify route structures during development.
              </p>
              <div className="bg-gray-50 p-3 font-mono text-xs text-gray-700 mb-3">
                <div className="text-green-600 mb-1">
                  $ next-introspect introspect . --watch
                </div>
                <div className="text-blue-600">
                  📝 File changed: app/blog/page.tsx
                </div>
                <div className="text-blue-600">🔄 Re-running analysis...</div>
              </div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Real-time
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 border border-gray-200 hover:border-gray-300 transition-colors group">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center mb-6 text-2xl font-bold">
                M
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Multiple Outputs
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Export in JSON, Markdown, TypeScript, or raw objects. Customize
                field filtering, path formatting, and nested structures for any
                workflow or integration.
              </p>
              <div className="bg-gray-50 p-3 font-mono text-xs text-gray-700 mb-3">
                <div className="text-blue-600 mb-1">
                  --format typescript --output routes.ts
                </div>
                <div className="text-blue-600 mb-1">--format json --nested</div>
                <div className="text-blue-600 mb-1">
                  --format markdown --metadata routes.json
                </div>
              </div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                4 Formats
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 border border-gray-200 hover:border-gray-300 transition-colors group">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center mb-6 text-2xl font-bold">
                C
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                CI/CD Ready
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Integrate into your build pipeline for automated route
                validation, documentation generation, and migration tracking.
                Works with GitHub Actions, Jenkins, and any CI/CD platform.
              </p>
              <div className="bg-gray-50 p-3 font-mono text-xs text-gray-700 mb-3">
                <div className="text-blue-600 mb-1">
                  # .github/workflows/routes.yml
                </div>
                <div>- run: next-introspect introspect .</div>
                <div className="text-gray-500">--format json --quiet</div>
              </div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Enterprise
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                10-30ms
              </div>
              <div className="text-sm text-gray-600 uppercase tracking-wider">
                Analysis Speed
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">100%</div>
              <div className="text-sm text-gray-600 uppercase tracking-wider">
                Type Safe
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
              <div className="text-sm text-gray-600 uppercase tracking-wider">
                Dependencies
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">∞</div>
              <div className="text-sm text-gray-600 uppercase tracking-wider">
                Routes
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Section */}
      <section id="installation" className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Get Started in Seconds
            </h2>
            <p className="text-xl text-gray-600">
              Install next-introspect and start analyzing your Next.js projects
              immediately
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* CLI Installation */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">💻</span>
                CLI Tool
              </h3>
              <p className="text-gray-600 mb-6">
                Install globally for command-line usage across all your
                projects.
              </p>

              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm mb-6">
                <div className="text-green-400"># Install globally</div>
                <div className="mt-2">npm install -g next-introspect</div>
                <div className="mt-1"># or with bun</div>
                <div>bun add -g next-introspect</div>
              </div>

              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-400"># Quick analysis</div>
                <div className="mt-2">
                  next-introspect introspect . --format json
                </div>
              </div>
            </div>

            {/* Programmatic Usage */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">📦</span>
                Programmatic API
              </h3>
              <p className="text-gray-600 mb-6">
                Install locally for programmatic usage in your applications and
                build tools.
              </p>

              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm mb-6">
                <div className="text-green-400"># Install locally</div>
                <div className="mt-2">npm install next-introspect</div>
                <div className="mt-1"># or with bun</div>
                <div>bun add next-introspect</div>
              </div>

              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-400"># Use in code</div>
                <div className="mt-2">
                  import {"{ NextIntrospect }"} from 'next-introspect';
                </div>
                <div className="mt-1">
                  const introspect = new NextIntrospect('./');
                </div>
              </div>
            </div>

            {/* One-time Usage */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">⚡</span>
                One-time Usage
              </h3>
              <p className="text-gray-600 mb-6">
                Try next-introspect without installing it globally. Use package
                runners to execute commands on-demand.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    With bunx (Bun package runner)
                  </div>
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
                    <div className="text-green-400"># Run once with bunx</div>
                    <div className="mt-2">
                      bunx next-introspect introspect . --format json
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    bunx downloads and runs packages without global installation
                  </p>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    With npx (npm package runner)
                  </div>
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
                    <div className="text-green-400"># Run once with npx</div>
                    <div className="mt-2">
                      npx next-introspect introspect . --format json
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    npx executes packages from npm registry without installation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Perfect for Every Use Case
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From development workflows to production deployments,
              next-introspect fits seamlessly into your process
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Development */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="text-blue-600 text-2xl mr-3">🚀</span>
                Development
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <strong className="text-gray-900">
                      Type-safe routing:
                    </strong>
                    <span className="text-gray-600">
                      {" "}
                      Generate TypeScript route helpers for full IDE
                      autocompletion
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <strong className="text-gray-900">Watch mode:</strong>
                    <span className="text-gray-600">
                      {" "}
                      Automatically update routes as you develop
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <strong className="text-gray-900">Route validation:</strong>
                    <span className="text-gray-600">
                      {" "}
                      Catch routing issues before they reach production
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <strong className="text-gray-900">Documentation:</strong>
                    <span className="text-gray-600">
                      {" "}
                      Auto-generate route documentation for your team
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Production */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="text-purple-600 text-2xl mr-3">🏭</span>
                Production
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <strong className="text-gray-900">
                      CI/CD integration:
                    </strong>
                    <span className="text-gray-600">
                      {" "}
                      Validate routes in your deployment pipeline
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <strong className="text-gray-900">Route inventory:</strong>
                    <span className="text-gray-600">
                      {" "}
                      Maintain comprehensive route documentation
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <strong className="text-gray-900">
                      Migration planning:
                    </strong>
                    <span className="text-gray-600">
                      {" "}
                      Track Pages Router to App Router migrations
                    </span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <strong className="text-gray-900">
                      Performance monitoring:
                    </strong>
                    <span className="text-gray-600">
                      {" "}
                      Monitor route complexity and optimization opportunities
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Code Examples Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Code Examples
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how next-introspect works in real scenarios
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* TypeScript Integration */}
            <div className="bg-white p-8 border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                TypeScript Route Helpers
              </h3>
              <div className="bg-gray-900 text-gray-100 p-6 font-mono text-sm mb-6">
                <div className="text-blue-300 mb-3">
                  {/* Generate type-safe routes */}
                </div>
                <div className="text-gray-200">
                  import &#123; routes &#125; from './routes';
                </div>
                <div className="mt-2"></div>
                <div className="text-gray-200">
                  {/* Type-safe navigation */}
                </div>
                <div className="text-gray-200">
                  const blogUrl = routes.blog.$slug(&#123;
                </div>
                <div className="text-gray-200 ml-4">slug: 'my-article'</div>
                <div className="text-gray-200">
                  &#125;); {/* → "/blog/my-article" */}
                </div>
                <div className="mt-2"></div>
                <div className="text-gray-200">{/* API endpoints */}</div>
                <div className="text-gray-200">
                  const apiUrl = routes.api.users.$id(&#123;
                </div>
                <div className="text-gray-200 ml-4">id: '123'</div>
                <div className="text-gray-200">
                  &#125;); {/* → "/api/users/123" */}
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Compile-time route validation prevents typos and ensures type
                safety.
              </p>
            </div>

            {/* Watch Mode */}
            <div className="bg-white p-8 border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Watch Mode Development
              </h3>
              <div className="bg-gray-900 text-gray-100 p-6 font-mono text-sm mb-6">
                <div className="text-green-400 mb-3">
                  $ next-introspect introspect . --watch
                </div>
                <div className="text-blue-400">
                  🔍 Analyzing Next.js project...
                </div>
                <div className="text-green-400 mt-2">✅ Analysis complete!</div>
                <div className="mt-3"></div>
                <div className="text-yellow-400">[File change detected]</div>
                <div className="text-blue-400">
                  📝 File changed: app/products/page.tsx
                </div>
                <div className="text-blue-400">🔄 Re-running analysis...</div>
                <div className="text-green-400 mt-1">✅ Routes updated!</div>
              </div>
              <p className="text-gray-600 text-sm">
                Automatically regenerates routes when you add or modify pages
                during development.
              </p>
            </div>

            {/* Programmatic Usage */}
            <div className="bg-white p-8 border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Programmatic API
              </h3>
              <div className="bg-gray-900 text-gray-100 p-6 font-mono text-sm mb-6">
                <div className="text-blue-300 mb-3">
                  {/* Programmatic usage */}
                </div>
                <div className="text-gray-200">
                  import &#123; NextIntrospect &#125; from 'next-introspect';
                </div>
                <div className="mt-2"></div>
                <div className="text-gray-200">
                  const introspect = new NextIntrospect('./');
                </div>
                <div className="text-gray-200">await introspect.analyze();</div>
                <div className="mt-2"></div>
                <div className="text-gray-200">{/* Get all routes */}</div>
                <div className="text-gray-200">
                  const routes = introspect.getRoutes();
                </div>
                <div className="mt-2"></div>
                <div className="text-gray-200">{/* Export to file */}</div>
                <div className="text-gray-200">
                  await introspect.exportToFile('routes.json');
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Use the full API programmatically in build tools, scripts, and
                CI/CD pipelines.
              </p>
            </div>

            {/* CI/CD Integration */}
            <div className="bg-white p-8 border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                CI/CD Integration
              </h3>
              <div className="bg-gray-900 text-gray-100 p-6 font-mono text-sm mb-6">
                <div className="text-blue-300 mb-3">
                  {/* # GitHub Actions workflow */}
                </div>
                <div className="text-gray-200">- name: Analyze Routes</div>
                <div className="text-gray-200"> run: |</div>
                <div className="text-gray-200 ml-4">
                  npm install -g next-introspect
                </div>
                <div className="text-gray-200 ml-4">
                  next-introspect introspect .
                </div>
                <div className="text-gray-200 ml-4">--format json --quiet</div>
                <div className="text-gray-200 ml-4">--output routes.json</div>
                <div className="mt-2"></div>
                <div className="text-blue-300 mb-1">
                  # Validate route changes
                </div>
                <div className="text-gray-200">- name: Check Routes</div>
                <div className="text-gray-200"> run: |</div>
                <div className="text-gray-200 ml-4">
                  if [ -n "$(git diff routes.json)" ]; then
                </div>
                <div className="text-gray-200 ml-6">
                  echo "Routes changed - review required"
                </div>
                <div className="text-gray-200 ml-4">fi</div>
              </div>
              <p className="text-gray-600 text-sm">
                Automate route validation and documentation generation in your
                CI/CD pipeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Documentation for LLMs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Access our complete documentation in formats optimized for AI
              assistants
            </p>
          </div>

          <div className="grid md:grid-cols-1 gap-8 max-w-4xl mx-auto">
            {/* LLM Full Text Endpoint */}
            <div className="bg-gray-50 p-8 border border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Full Documentation Text
              </h3>
              <div className="mb-6">
                <a
                  href="/next-introspect/llms-full.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-black hover:bg-gray-800 transition-colors"
                >
                  Access Full Documentation Text
                </a>
              </div>
              <p className="text-gray-600 mb-6">
                Get the entire documentation site content in a single,
                LLM-optimized plain text format. Perfect for AI assistants that
                need comprehensive context about next-introspect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Analyze Your Next.js Routes?
          </h2>
          <p className="text-xl mb-12 text-gray-300">
            Join developers worldwide who use next-introspect to understand,
            document, and optimize their Next.js applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/docs"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-black bg-white hover:bg-gray-100 transition-colors"
            >
              Read the Docs
            </Link>
            <a
              href="https://github.com/benfavre/next-introspect"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 transition-colors"
            >
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Our Sponsors
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're grateful to our sponsors who help make next-introspect
              possible
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Current Sponsor */}
            <div className="bg-white p-8 border border-gray-200 hover:border-gray-300 transition-colors group">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-4">
                  Webdesign29
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Professional web agency based in Brest, France. Experts in
                  creating modern websites and applications for startups and
                  businesses.
                </p>
                <a
                  href="https://webdesign29.net/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-black hover:bg-gray-800 transition-colors"
                >
                  Visit Website
                </a>
              </div>
            </div>

            {/* Sponsor Slot 1 */}
            <div className="bg-white p-8 border border-dashed border-gray-300 hover:border-gray-400 transition-colors group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mb-6 mx-auto text-2xl font-bold text-gray-400">
                  +
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-4">
                  Your Company
                </div>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Support open source development and showcase your brand here.
                </p>
                <div className="text-sm text-gray-500">
                  Available for sponsorship
                </div>
              </div>
            </div>

            {/* Sponsor Slot 2 */}
            <div className="bg-white p-8 border border-dashed border-gray-300 hover:border-gray-400 transition-colors group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mb-6 mx-auto text-2xl font-bold text-gray-400">
                  +
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-4">
                  Your Company
                </div>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Support open source development and showcase your brand here.
                </p>
                <div className="text-sm text-gray-500">
                  Available for sponsorship
                </div>
              </div>
            </div>
          </div>

          {/* Sponsorship CTA */}
          <div className="text-center">
            <div className="bg-white p-8 border border-gray-200 max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Interested in Sponsoring?
              </h3>
              <p className="text-gray-600 mb-6">
                Help support the development of next-introspect and get your
                company's logo displayed here with a link to your website.
              </p>
              <a
                href="https://github.com/benfavre/next-introspect"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-black hover:bg-gray-800 transition-colors"
              >
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="text-3xl font-bold text-white mb-6">
                Next Introspect
              </div>
              <p className="text-gray-400 mb-8 leading-relaxed text-lg">
                A comprehensive Next.js project introspection tool for modern
                web development.
              </p>
              <div className="flex space-x-8">
                <a
                  href="https://github.com/benfavre/next-introspect"
                  className="text-gray-400 hover:text-white transition-colors text-lg font-medium"
                >
                  GitHub
                </a>
                <a
                  href="https://www.npmjs.com/package/next-introspect"
                  className="text-gray-400 hover:text-white transition-colors text-lg font-medium"
                >
                  npm
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">
                Resources
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link
                    href="/docs"
                    className="text-gray-400 hover:text-white transition-colors text-base"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/benfavre/next-introspect/tree/main/tests"
                    className="text-gray-400 hover:text-white transition-colors text-base"
                  >
                    Examples
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/benfavre/next-introspect/blob/main/CHANGELOG.md"
                    className="text-gray-400 hover:text-white transition-colors text-base"
                  >
                    Changelog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6 text-lg">
                Community
              </h4>
              <ul className="space-y-4">
                <li>
                  <a
                    href="https://github.com/benfavre/next-introspect/issues"
                    className="text-gray-400 hover:text-white transition-colors text-base"
                  >
                    Issues
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/benfavre/next-introspect/discussions"
                    className="text-gray-400 hover:text-white transition-colors text-base"
                  >
                    Discussions
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/benfavre/next-introspect/blob/main/CONTRIBUTING.md"
                    className="text-gray-400 hover:text-white transition-colors text-base"
                  >
                    Contributing
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-500 text-base">
              &copy; 2025 Next Introspect. MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
