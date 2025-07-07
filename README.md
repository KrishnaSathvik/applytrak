# 🚀 Job Application Tracker

A modern, feature-rich job application tracking system built with React, TypeScript, and Tailwind CSS. Track your job search journey with style, analytics, and smart organization.

![Job Application Tracker](https://img.shields.io/badge/React-18+-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue) ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3+-blue) ![IndexedDB](https://img.shields.io/badge/Storage-IndexedDB-green)

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

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18+ |
| **TypeScript** | Type Safety | 5+ |
| **Tailwind CSS** | Styling | 3+ |
| **Zustand** | State Management | Latest |
| **Dexie.js** | IndexedDB Wrapper | Latest |
| **Lucide React** | Icons | Latest |
| **Recharts** | Data Visualization | Latest |
| **React Hook Form** | Form Management | Latest |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/job-application-tracker.git
cd job-application-tracker

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
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    /* Add your custom colors */
}
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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Original Inspiration**: Based on a successful vanilla JavaScript job tracker
- **Design System**: Inspired by modern glassmorphism and neumorphism trends
- **Icons**: [Lucide React](https://lucide.dev/) for beautiful, consistent icons
- **Charts**: [Recharts](https://recharts.org/) for responsive data visualization

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/YOUR_USERNAME/job-tracker/issues) page
2. Create a new issue with detailed information
3. Include browser version, steps to reproduce, and screenshots if applicable

## 🗺️ Roadmap

### Upcoming Features
- [ ] **Backend Integration** - Optional cloud sync and backup
- [ ] **Mobile App** - React Native implementation
- [ ] **AI Features** - Resume optimization and job matching
- [ ] **Team Collaboration** - Multi-user workspaces
- [ ] **Advanced Analytics** - Machine learning insights
- [ ] **Integration APIs** - LinkedIn, Indeed, Glassdoor connections

---

Made with ❤ for job seekers everywhere. Good luck with your applications! 🍀
