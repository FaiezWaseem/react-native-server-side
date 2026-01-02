# React Native Server-Driven UI  (Next.js)

This is a **React Native Server-Driven UI (RN-SDUI) Content Management System** built with Next.js, Prisma, and Tailwind CSS. It allows you to create and manage React Native layouts dynamically from a web dashboard and serve them to your React Native applications via REST APIs.

## 🚀 Features

*   **Multi-App Support**: Create and manage content for multiple independent React Native apps (e.g., Customer App, Driver App).
*   **Dynamic Page Builder**: Write standard React Native code (JSX) directly in the browser.
*   **AI-Powered Generation**: Integrated AI assistant to generate React Native UI code from text descriptions.
*   **Live Mobile Preview**: Real-time preview of your React Native code using `react-native-web`.
*   **Server-Driven UI API**: Expose your pages as JSON data containing transpiled code or raw content to be rendered by your mobile app.
*   **Admin Dashboard**: Manage apps, pages, and publish status.

---

## 🛠️ Project Setup

### Prerequisites

*   Node.js 18+
*   MySQL Database (or a local instance)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd react-native-server-side
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="mysql://user:password@localhost:3306/rnss"
    POLLINATION_AI="your_api_key_here" # Optional: For AI code generation
    JWT_SECRET="your_jwt_secret"
    ```

4.  **Database Setup**:
    ```bash
    npx prisma migrate dev

    npx prisma generate

    npx prisma db push
    # Optional: Seed the database
    # npx prisma db seed
    ```

5.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    Access the admin dashboard at `http://localhost:3000/admin`.

---

## 📱 Mobile App Integration (API Endpoints)

Your React Native app should consume these endpoints to fetch the UI configuration.

### 1. Get Page Content

Fetch a specific page by its slug and the app's slug.

*   **Endpoint**: `GET /api/app/page/[pageSlug]`
*   **Query Params**:
    *   `appSlug` (Required): The unique identifier for your app (e.g., `customer-app`).
*   **Response**:
    ```json
    {
      "id": "uuid",
      "slug": "home",
      "title": "Home Page",
      "transpiled_code": "...", // If using server-side transpilation
      "content": "...", // Raw JSX code
      "createdAt": "2023-10-27T...",
      "updatedAt": "2023-10-27T..."
    }
    ```

### Example Usage (React Native)

```javascript
// Example fetch function in your React Native app
const fetchPage = async (pageSlug) => {
  const APP_SLUG = "my-awesome-app"; // Your App's slug from the CMS
  const response = await fetch(
    `https://your-cms-url.com/api/app/page/${pageSlug}?appSlug=${APP_SLUG}`
  );
  
  if (!response.ok) {
    throw new Error("Page not found");
  }
  
  const pageData = await response.json();
  return pageData; // Contains .content (JSX string)
};
```

---

## 🖥️ Admin Dashboard Workflow

1.  **Create an App**:
    *   Go to **Applications** in the sidebar.
    *   Click **New App** and give it a name (e.g., "Rider App").
    *   The system automatically creates a `splash` page for every new app.

2.  **Manage Pages**:
    *   Click **Manage Pages** on an App card.
    *   Create a new page (e.g., "Home", "Profile").

3.  **Edit Content**:
    *   Use the **Code Editor** on the left to write React Native code.
    *   Use the **AI Generate** button to create UI from prompts (e.g., "Create a login screen with email and password").
    *   See the **Live Preview** on the right updating instantly.

4.  **Publish**:
    *   Toggle the **Publish** switch to make the page live and accessible via the API.

---

## 🤖 AI Code Generation

The CMS uses **Pollinations AI** (via OpenAI client compatibility) to generate React Native code.
*   **System Prompt**: Enforces strict React Native constraints (no imports, specific component list).
*   **Integration**: The generated code is automatically inserted into the editor and previewed.

## 🏗️ Architecture

*   **Frontend**: Next.js 14 (App Router), Tailwind CSS, Shadcn UI.
*   **Backend**: Next.js API Routes.
*   **Database**: MySQL with Prisma ORM.
*   **Code Editor**: Monaco Editor.
*   **Preview Engine**: `react-native-web` + `@babel/standalone` running in a custom React renderer.
