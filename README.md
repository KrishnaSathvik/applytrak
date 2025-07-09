# 🚀 ApplyTrak

A modern, feature-rich job application tracking system built with React, TypeScript, and Tailwind CSS. Track your job
search journey with style, analytics, and smart organization.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-applytrak.com-4A5E54?style=for-the-badge)](https://applytrak.com)

![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3+-06B6D4?logo=tailwindcss) ![IndexedDB](https://img.shields.io/badge/Storage-IndexedDB-FF6B35)

## ✨ Features

### 📊 **Smart Application Management**

- **Paginated Table View**: Clean, responsive table with 15 applications per page
- **Advanced Search & Filtering**: Real-time search across all application fields
- **Bulk Operations**: Select and manage multiple applications at once
- **Fixed Table Layout**: No horizontal scrolling, content stays contained

### 🎯 **Goal Tracking & Analytics**

- **Smart Goal Setting**: Total, weekly, and monthly application goals
- **Progress Visualization**: Beautiful progress bars and streak counters
- **Success Analytics**: Track success rates, response times, and trends
- **Interactive Charts**: Visual insights into your job search performance

### 🎨 **Modern UI/UX**

- **Glassmorphism Design**: Beautiful frosted glass effects and modern aesthetics
- **Dark/Light Themes**: Auto-detecting system theme with manual toggle
- **Responsive Design**: Perfect experience on desktop, tablet, and mobile
- **Micro-Animations**: Smooth transitions and delightful interactions

### 💾 **Data Management**

- **Local Storage**: Secure IndexedDB storage with Dexie.js
- **Export/Import**: JSON and PDF export capabilities
- **Auto-Backup**: Automatic data backup and recovery system
- **Offline-First**: Works completely offline, no server required

### ⚡ **Performance & Developer Experience**

- **TypeScript**: Full type safety and better development experience
- **Component Architecture**: Reusable, maintainable React components
- **Lazy Loading**: Optimized loading with React.Suspense
- **Keyboard Shortcuts**: Power-user productivity features

## 🛠️ Tech Stack

| Technology          | Purpose            | Version |
|---------------------|--------------------|---------|
| **React**           | UI Framework       | 19+     |
| **TypeScript**      | Type Safety        | 5+      |
| **Tailwind CSS**    | Styling            | 3+      |
| **Zustand**         | State Management   | Latest  |
| **Dexie.js**        | IndexedDB Wrapper  | Latest  |
| **Lucide React**    | Icons              | Latest  |
| **Recharts**        | Data Visualization | Latest  |
| **React Hook Form** | Form Management    | Latest  |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/KrishnaSathvik/applytrak.git
cd applytrak

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
# Create production build
npm run build

# Serve production build locally
npm run serve

# Deploy to Vercel (optional)
npm run deploy
```

## 📱 Usage

### Adding Applications

1. Fill out the application form with company, position, date, and details
2. Upload attachments (resumes, cover letters)
3. Add notes and track the job source
4. Click "Add Application" to save

### Setting Goals

1. Click "Set Goals" in the goal tracking section
2. Set your total, weekly, and monthly application targets
3. Track your progress with visual indicators
4. Celebrate milestones and maintain streaks

### Viewing Analytics

1. Switch to the "Analytics" tab
2. View success rates, application trends, and insights
3. Filter data by date ranges
4. Export charts and reports

### Data Management

1. **Export**: Use the export buttons to save your data as JSON or PDF
2. **Import**: Upload a JSON file to restore or migrate data
3. **Backup**: Automatic backups are created hourly
4. **Recovery**: Access recovery options if data is lost

## 📸 Screenshots

### Dashboard View

*Beautiful overview with goal tracking and recent applications*

### Application Table

*Clean, paginated table with advanced search and filtering*

### Analytics Dashboard

*Comprehensive insights and data visualization*

### Dark Theme

*Elegant dark mode with smooth transitions*

## 🔧 Configuration

### Customizing Goals

Edit the goal limits in `src/components/modals/GoalModal.tsx`:

```typescript
const schema = yup.object({
    totalGoal: yup.number().min(1).max(10000), // Adjust max limit
    weeklyGoal: yup.number().min(1).max(500),
    monthlyGoal: yup.number().min(1).max(2000)
});
```

### Theme Customization

Modify colors in `src/styles/globals.css`:

```css
:root {
    --primary-color: #4A5E54;
    --secondary-color: #E5E5E5;
    --accent-color: #F5F5F0;
    /* Add your custom colors */
}
```

### Environment Variables

Create a `.env.local` file:

```bash
REACT_APP_NAME=ApplyTrak
REACT_APP_DESCRIPTION="Track your job search journey"
REACT_APP_URL=https://applytrak.com
```

## 📂 Project Structure

```
src/
├── components/
│   ├── charts/           # Analytics and visualization
│   ├── forms/            # Application forms
│   ├── layout/           # Header, sidebar, layout
│   ├── modals/           # Goal setting, edit modals
│   ├── tables/           # Paginated application tables
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── services/             # Database and API services
├── store/                # Zustand state management
├── styles/               # Global CSS and themes
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## 🚀 Deployment

### Deploy to Vercel

1. **Fork this repository**
2. **Connect to Vercel**: [vercel.com/new](https://vercel.com/new)
3. **Import your repository**
4. **Add custom domain**: `applytrak.com` (optional)
5. **Deploy**: Automatic deployments on every push

### Deploy to Netlify

```bash
# Build the project
npm run build

# Deploy to Netlify
npx netlify deploy --prod --dir=build
```

### Deploy to GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"predeploy": "npm run build",
"deploy": "gh-pages -d build"

# Deploy
npm run deploy
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to
discuss what you would like to change.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Use Tailwind CSS for styling
- Write meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Original Inspiration**: Based on a successful vanilla JavaScript job tracker
- **Design System**: Inspired by modern glassmorphism and neumorphism trends
- **Icons**: [Lucide React](https://lucide.dev/) for beautiful, consistent icons
- **Charts**: [Recharts](https://recharts.org/) for responsive data visualization
- **UI Framework**: [Tailwind CSS](https://tailwindcss.com/) for rapid UI development

## 📞 Support

If you encounter any issues or have questions:

1. **Check the [Issues](https://github.com/KrishnaSathvik/applytrak/issues) page**
2. **Create a new issue** with detailed information
3. **Include**: Browser version, steps to reproduce, and screenshots if applicable

For feature requests, please open an issue with the "enhancement" label.

## 🗺️ Roadmap

### Phase 2: Backend Integration

- [ ] **Cloud Sync** - Optional cloud backup and sync
- [ ] **User Authentication** - Secure user accounts
- [ ] **Team Collaboration** - Multi-user workspaces

### Phase 3: Advanced Features

- [ ] **Mobile App** - React Native implementation
- [ ] **AI Features** - Resume optimization and job matching
- [ ] **Advanced Analytics** - Machine learning insights
- [ ] **Integration APIs** - LinkedIn, Indeed, Glassdoor connections

### Phase 4: Enterprise Features

- [ ] **SSO Integration** - Enterprise authentication
- [ ] **Advanced Reporting** - Custom reports and dashboards
- [ ] **API Access** - REST API for integrations
- [ ] **White-label Solutions** - Customizable branding

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/KrishnaSathvik/applytrak?style=social)
![GitHub forks](https://img.shields.io/github/forks/KrishnaSathvik/applytrak?style=social)
![GitHub issues](https://img.shields.io/github/issues/KrishnaSathvik/applytrak)
![GitHub license](https://img.shields.io/github/license/KrishnaSathvik/applytrak)

---

<div align="center">

**[🌐 Live Demo](https://applytrak.com)** • **[📝 Documentation](https://github.com/KrishnaSathvik/applytrak/wiki)** • *
*[🐛 Report Bug](https://github.com/KrishnaSathvik/applytrak/issues)** • *
*[✨ Request Feature](https://github.com/KrishnaSathvik/applytrak/issues)**

Made with ❤️ for job seekers everywhere. Good luck with your applications! 🍀

**⭐ Star this repo if ApplyTrak helped you land your dream job!**

</div>
