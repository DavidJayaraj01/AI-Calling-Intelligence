# 🚀 AI Call Intelligence - Frontend

> **Live Demo**: https://conversa-ai.onrender.com  
> **Backend API**: https://ai-calling-intelligence.onrender.com

A modern, responsive React application providing an intuitive interface for AI-powered call analysis and business intelligence.

## 🌟 **Key Features**

### 🎨 **Modern UI/UX**
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety and developer experience
- **Tailwind CSS**: Utility-first styling with responsive design
- **Lucide Icons**: Beautiful, consistent iconography
- **Responsive Design**: Mobile-first, works on all devices

### 📊 **Interactive Dashboards**
- **Real-time Analytics**: Live KPIs and performance metrics
- **Recharts Integration**: Beautiful, interactive charts and graphs
- **Call History**: Comprehensive call management interface
- **Action Items Tracking**: Smart task management system
- **QBR Management**: Quarterly business review tools

### 🤖 **AI Integration**
- **Audio Upload**: Direct audio file processing with OpenAI Whisper
- **Transcript Analysis**: Real-time AI analysis with GPT-4o-mini
- **Pain Point Visualization**: Interactive pain point categorization
- **Sentiment Timeline**: Visual sentiment analysis over time
- **Action Item Generation**: AI-powered task creation

### ⚡ **Performance**
- **Vite**: Lightning-fast development and building
- **Code Splitting**: Optimized bundle sizes
- **Lazy Loading**: Efficient component loading
- **Error Boundaries**: Graceful error handling
- **Progressive Enhancement**: Works without JavaScript

## 🚀 **Quick Start**

### 📋 **Prerequisites**
- Node.js 18+
- npm or yarn
- Backend API running (see backend README)

### 🛠️ **Installation**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your backend URL (see Configuration section)

# Start development server
npm run dev
```

### 🌐 **Development URLs**
- **Application**: http://localhost:5173
- **Backend API**: http://localhost:8000 (must be running)

### 🔧 **Available Scripts**

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type checking
npm run type-check
```

## ⚙️ **Configuration**

### 🔧 **Environment Variables** (`.env`)

```env
# 🔗 Backend API Configuration
VITE_API_URL=http://localhost:8000

# 📱 Application Configuration
VITE_APP_NAME=AI Call Intelligence Platform
VITE_APP_VERSION=1.0.0

# 🐛 Development Configuration
VITE_DEBUG=true
```

### 🌍 **Environment Setup**

#### **Development**
```env
VITE_API_URL=http://localhost:8000
VITE_DEBUG=true
```

#### **Production**
```env
VITE_API_URL=https://ai-calling-intelligence.onrender.com
VITE_DEBUG=false
```

## 🏗️ **Project Structure**

```
frontend/
├── public/                    # 🌐 Static assets
│   ├── vite.svg              # 🖼️ App icon
│   └── image.png             # 📸 Images
│
├── src/                      # 📦 Source code
│   ├── main.tsx             # 🚀 Application entry point
│   ├── App.tsx              # 🏗️ Main App component
│   ├── index.css            # 🎨 Global styles
│   │
│   ├── components/          # 🧩 Reusable UI components
│   │   ├── layout/         # 📐 Layout components
│   │   │   ├── Layout.tsx  # 🏠 Main layout wrapper
│   │   │   ├── Navbar.tsx  # 🧭 Navigation bar
│   │   │   └── Sidebar.tsx # 📋 Side navigation
│   │   │
│   │   └── ui/             # 🎛️ UI primitives
│   │       ├── Button.tsx  # 🔘 Button component
│   │       ├── Card.tsx    # 📄 Card component
│   │       ├── Badge.tsx   # 🏷️ Badge component
│   │       ├── Input.tsx   # ⌨️ Input component
│   │       ├── Table.tsx   # 📊 Table component
│   │       └── Charts.tsx  # 📈 Chart components
│   │
│   ├── pages/              # 📄 Application pages
│   │   ├── Dashboard.tsx           # 🏠 Main dashboard
│   │   ├── DashboardReal.tsx       # 📊 Real data dashboard
│   │   ├── CallsPage.tsx           # 📞 Calls management
│   │   ├── CallDetailPage.tsx      # 🔍 Call details
│   │   ├── CallAnalysisPage.tsx    # 🤖 AI analysis interface
│   │   ├── CallAnalysisPageReal.tsx # 🎯 Real AI analysis
│   │   ├── ActionItemsPage.tsx     # ✅ Action items management
│   │   ├── ModelTestPage.tsx       # 🧪 AI model testing
│   │   ├── QBRPage.tsx            # 📈 Quarterly business reviews
│   │   ├── SentimentTimelinePage.tsx # 📊 Sentiment analysis
│   │   └── NotificationsPage.tsx   # 🔔 Notifications
│   │
│   ├── services/           # 🌐 API integration
│   │   ├── api.ts         # 🔗 Main API service
│   │   └── realApi.ts     # 🎯 Real data API service
│   │
│   ├── contexts/          # 🔄 React contexts
│   │   └── AuthContext.tsx # 🔐 Authentication context
│   │
│   ├── types/             # 📝 TypeScript definitions
│   │   ├── index.ts       # 🏷️ General types
│   │   └── realData.ts    # 📊 Real data types
│   │
│   ├── data/              # 📊 Static data
│   │   └── mockData.ts    # 🎭 Mock data for development
│   │
│   ├── utils/             # 🛠️ Utility functions
│   │   └── cn.ts          # 🎨 Tailwind class utilities
│   │
│   └── assets/            # 🖼️ Static assets
│       └── react.svg      # ⚛️ React logo
│
├── package.json           # 📦 Dependencies and scripts
├── tsconfig.json          # 📝 TypeScript configuration
├── vite.config.ts         # ⚡ Vite configuration
├── tailwind.config.js     # 🎨 Tailwind CSS configuration
├── postcss.config.js      # 🔧 PostCSS configuration
└── eslint.config.js       # 📏 ESLint configuration
```

## 🧩 **Components Architecture**

### 📐 **Layout Components**

#### **Layout.tsx** - Main layout wrapper
```tsx
- Navigation structure
- Sidebar integration
- Main content area
- Responsive breakpoints
```

#### **Navbar.tsx** - Top navigation
```tsx
- Logo/brand
- User menu
- Quick actions
- Mobile menu toggle
```

#### **Sidebar.tsx** - Side navigation
```tsx
- Navigation menu
- Active route highlighting
- Collapsible sections
- User profile section
```

### 🎛️ **UI Components**

#### **Card.tsx** - Content containers
```tsx
- Flexible card layouts
- Header/content/footer sections
- Shadow and border variants
- Loading states
```

#### **Button.tsx** - Interactive buttons
```tsx
- Multiple variants (primary, secondary, outline)
- Size variations (sm, md, lg)
- Loading states
- Icon support
```

#### **Charts.tsx** - Data visualization
```tsx
- Line charts for trends
- Bar charts for comparisons
- Pie charts for distributions
- Real-time data updates
```

## 📄 **Pages Overview**

### 🏠 **Dashboard** (`Dashboard.tsx`)
- **KPI Cards**: Total calls, pain points, action items
- **Trend Charts**: Sentiment analysis over time
- **Recent Activity**: Latest calls and updates
- **Quick Actions**: Common tasks and shortcuts

### 📞 **Calls Management** (`CallsPage.tsx`)
- **Call List**: Paginated call history
- **Search & Filter**: Find calls by criteria
- **Status Indicators**: Call analysis status
- **Bulk Actions**: Batch operations

### 🤖 **AI Analysis** (`CallAnalysisPage.tsx`)
- **Audio Upload**: Drag-and-drop audio processing
- **Transcript Input**: Manual transcript entry
- **Real-time Analysis**: Live AI processing
- **Results Visualization**: Pain points and action items

### ✅ **Action Items** (`ActionItemsPage.tsx`)
- **Task Management**: Create, update, delete tasks
- **Priority Filtering**: Sort by priority levels
- **Status Tracking**: Progress monitoring
- **Due Date Management**: Deadline tracking

### 📊 **QBR** (`QBRPage.tsx`)
- **Report Generation**: Automated QBR creation
- **Data Aggregation**: Multi-call analysis
- **Export Options**: PDF/Excel export
- **Template Management**: Custom report templates

## 🌐 **API Integration**

### 🔗 **API Service** (`api.ts`)

#### **Core Functions**
```typescript
// Audio processing
processAudio(file: File): Promise<ApiResponse>
transcribeAudio(file: File): Promise<ApiResponse>  
analyzeTranscript(transcript: string): Promise<ApiResponse>

// Call management
getCalls(params?: CallFilters): Promise<ApiResponse>
getCallDetail(id: number): Promise<ApiResponse>
getDashboardAnalytics(): Promise<ApiResponse>

// Action items
getActionItems(params?: ActionItemFilters): Promise<ApiResponse>
updateActionItemStatus(id: number, status: string): Promise<ApiResponse>
```

#### **Error Handling**
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}
```

### 🎯 **Real API Service** (`realApi.ts`)
- **Production Endpoints**: Live data integration
- **Authentication**: JWT token management
- **Caching**: Response caching for performance
- **Retry Logic**: Automatic retry on failures

## 🎨 **Styling & Theming**

### 🌈 **Tailwind CSS Setup**
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...},
        accent: {...}
      }
    }
  },
  plugins: [...]
}
```

### 🎭 **Component Styling Patterns**
```tsx
// Using cn utility for conditional classes
const Button = ({ variant, size, className, ...props }) => {
  return (
    <button
      className={cn(
        "base-button-classes",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};
```

## 📱 **Responsive Design**

### 📐 **Breakpoints**
```css
/* Mobile First Approach */
sm: 640px    /* Small devices */
md: 768px    /* Medium devices */
lg: 1024px   /* Large devices */
xl: 1280px   /* Extra large devices */
2xl: 1536px  /* 2X Extra large devices */
```

### 🔄 **Responsive Components**
- **Grid Layouts**: Auto-responsive grid systems
- **Navigation**: Mobile hamburger menu
- **Tables**: Horizontal scroll on mobile
- **Charts**: Adaptive chart sizing
- **Cards**: Stacked layout on small screens

## 🚀 **Build & Deployment**

### 🏗️ **Build Process**
```bash
# Development build
npm run dev

# Production build
npm run build
# Output: dist/ directory

# Preview production build
npm run preview
```

### 📊 **Build Output**
```
dist/
├── index.html           # Main HTML file
├── assets/
│   ├── index-[hash].css # Minified CSS
│   ├── index-[hash].js  # Minified JavaScript
│   └── [assets]         # Images, fonts, etc.
└── [static files]       # Public directory contents
```

### 🌐 **Deployment Options**

#### **Render** (Current)
```yaml
# render.yaml
- type: web
  name: ai-calling-intelligence-frontend
  buildCommand: cd frontend && npm install && npm run build
  staticPublishPath: frontend/dist
  envVars:
    - key: VITE_API_URL
      value: https://ai-calling-intelligence.onrender.com
```

#### **Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### **Netlify**
```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables
VITE_API_URL=https://your-backend-url.com
```

### 🔧 **Production Configuration**
```env
# Production environment
VITE_API_URL=https://ai-calling-intelligence.onrender.com
VITE_DEBUG=false
VITE_APP_NAME=AI Call Intelligence Platform
```

## 🔧 **Development**

### 🛠️ **Development Tools**
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (via ESLint)
- **Vite**: Fast development server
- **React DevTools**: Browser extension for debugging

### 🧪 **Testing Setup**
```bash
# Add testing dependencies (optional)
npm install -D @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm run test
```

### 🔍 **Debugging**
```typescript
// Debug mode
if (import.meta.env.VITE_DEBUG === 'true') {
  console.log('Debug information');
}

// Environment info
console.log('API URL:', import.meta.env.VITE_API_URL);
```

## 📈 **Performance Optimization**

### ⚡ **Bundle Optimization**
- **Code Splitting**: Route-based lazy loading
- **Tree Shaking**: Remove unused code
- **Asset Optimization**: Image and font optimization
- **Gzip Compression**: Automatic compression

### 🔄 **Runtime Performance**
- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Memoize expensive operations
- **Lazy Loading**: Load components on demand
- **Virtual Scrolling**: Handle large lists efficiently

### 📊 **Performance Metrics**
Current build sizes:
- **CSS**: ~33KB (6KB gzipped)
- **JavaScript**: ~690KB (202KB gzipped)
- **Total**: < 1MB optimized bundle

## 🐛 **Troubleshooting**

### 🔧 **Common Issues**

| Issue | Cause | Solution |
|-------|-------|----------|
| **Build Failures** | TypeScript errors | Fix type errors, check imports |
| **API Connection** | Wrong VITE_API_URL | Verify backend URL in .env |
| **CORS Errors** | Backend CORS config | Ensure backend allows frontend domain |
| **Routing Issues** | Missing routes | Check React Router configuration |
| **Styling Problems** | Tailwind not loaded | Verify Tailwind CSS imports |

### 🔍 **Debug Tools**
```bash
# Check environment variables
npm run dev -- --debug

# Build analysis
npm run build -- --analyze

# Type checking
npm run type-check
```

## 🤝 **Contributing**

### 🔄 **Development Workflow**
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Make changes with TypeScript support
4. Test in browser
5. Run linting: `npm run lint`
6. Build for production: `npm run build`
7. Submit pull request

### 📝 **Code Standards**
- **TypeScript**: Use proper typing
- **React Hooks**: Follow hooks rules
- **Component Structure**: Consistent component patterns
- **Styling**: Use Tailwind CSS utilities
- **Error Handling**: Graceful error boundaries

### 🎨 **UI/UX Guidelines**
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels and keyboard navigation
- **Performance**: Optimize for Core Web Vitals
- **Consistency**: Follow design system patterns

---

## 🎉 **Ready to Build!**

Your AI Call Intelligence frontend is ready to provide an amazing user experience for intelligent call analysis!

**Start development**: `npm run dev`  
**Visit application**: http://localhost:5173  
**View live demo**: https://conversa-ai.onrender.com

Happy coding! 🚀✨
