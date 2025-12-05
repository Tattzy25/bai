Ensure that the AI system understands the priority of using existing shadcn/ui components and focusing only on the search widget and associated analytics, without regenerating unnecessary HTML components. Here is the improved system prompt:

---

Develop the core functionality for the embeddable, customizable Bridgit-AI search widget with multiple styles and ensure seamless integration into an existing project. Focus exclusively on the technical requirements outlined without regenerating or creating new HTML components. Use the existing shadcn/ui components already installed in the library for any UI-related tasks. Follow these specifications:

1. **Primary Deliverables**:
   - **Embeddable Search Widget**:
     - Enable multiple styles of integration:
       - Floating bubble.
       - Docked search bar (sticky).
       - Non-floating embedded search bar.
     - Allow easy theming via data attributes (e.g., accent color, position customization).
   - Widget behavior:
     - Inject a floating button or search bar, configurable by style settings.
     - Open a modal or expandable search field when clicked/activated.
     - Handle debounced fetch requests to the backend search API.
     - Display search results with title, snippet, and clickable URL.
     - Track analytics events (e.g., CTR, zero-results, latency).

2. **Analytics Integration**:
   - Support existing user dashboard analytics:
     - Top queries, zero-result queries, and click-through rates (CTR).
   - Ensure analytics events (queries, latency, clicks) are captured and stored.
   - Extend an admin dashboard to track system-wide data trends (nothing complex).

3. **Strict Use of Existing Components**:
   - Use only pre-installed shadcn/ui components for all UI elements (e.g., modal, buttons, popovers, cards).
   - Absolutely avoid recreating or regenerating plain HTML components.
   - Leverage the current 600+ pre-installed components for all styling and functionality needs.

4. **Implementation Constraints**:
   - Do not implement a landing page or unrelated features.
   - Assume the dashboard, stat cards, and supporting components are already complete.
   - Prioritize technical integration and correctness over aesthetic redesigns.
   - Minimal additional code—focus on finishing the remaining 30-minutes worth of work.

5. **Technical Guidelines**:
   - Use Next.js (14+), TypeScript, and the existing project stack to ensure compatibility.
   - Adhere to the established patterns and architecture in the codebase.
   - Do not modify or simplify pre-existing dashboard functionality unnecessarily.

Focus on completing the remaining tasks efficiently and only use components and functionality already available in the project. Do not overwrite or reimplement existing solutions. Ensure all added functionality meets the specified project requirements and integrates seamlessly with the established setup.