
# 🌳 TreeTrace

<div align="center">
  <img src="https://img.shields.io/badge/Status-Beta-green?style=for-the-badge" alt="Beta Status">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License">
  <img src="https://img.shields.io/badge/Version-1.0.0-orange?style=for-the-badge" alt="Version">
</div>

<div align="center">
  <h3>🧬 Your Family Story, Beautifully Connected</h3>
  <p>A modern, AI-powered family tree platform that helps you build, visualize, and preserve your family heritage while tracking health patterns across generations.</p>
</div>

---

## ✨ Features

### 🌟 **Interactive Family Trees**

* **Drag & Drop Interface** - Build your family tree with intuitive controls
* **Multiple Relationship Types** - Support for biological, adopted, step, and foster relationships
* **Real-time Collaboration** - Work together with family members
* **Smart Suggestions** - AI-powered recommendations for potential family connections

### 🏥 **Health Heritage Tracking**

* **Medical History Management** - Comprehensive health condition tracking
* **Hereditary Risk Analysis** - Identify patterns and genetic predispositions
* **AI Health Insights** - Generate intelligent health reports and recommendations
* **Secure Data Storage** - HIPAA-compliant health information protection

### 🔍 **Advanced Features**

* **Powerful Search & Filtering** - Find family members and health conditions instantly
* **Export & Sharing Tools** - Generate PDFs, CSV exports, and shareable links
* **Community Connections** - Discover potential family matches through our network
* **Mobile Responsive** - Access your family tree anywhere, anytime

---

## 🚀 Quick Start

### Prerequisites

* Node.js 18+
* MongoDB 5.0+
* npm or yarn

### Installation

1. **Clone the repository**

```shell
git clone https://github.com/ZenXen7/TreeTrace.git
cd treetrace
```

2. **Install dependencies**

```shell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Environment Setup**

```shell
# Backend .env
DATABASE_URL=mongodb://localhost:27017/treetrace
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key

# Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. **Start the application**

```shell
# Backend (Port 3001)
cd backend
npm run start:dev

# Frontend (Port 3000)
cd frontend
npm run dev
```

5. **Visit** `http://localhost:3000` and start building your family tree! 🎉

---

## 🛠️ Tech Stack

### Backend

| Technology     | Purpose                        | Version |
| -------------- | ------------------------------ | ------- |
| **NestJS**     | Node.js framework (structured) | ^10.0.0 |
| **MongoDB**    | NoSQL database                 | ^5.0    |
| **TypeScript** | Type safety                    | ^5.0    |
| **JWT**        | Authentication                 | ^9.0    |

### Frontend

| Technology      | Purpose                   | Version |
| --------------- | ------------------------- | ------- |
| **Next.js**     | React framework           | ^14.0   |
| **shadcn/ui**   | UI components library     | ^0.2.0+ |
| **TypeScript**  | Type safety               | ^5.0    |
| **TailwindCSS** | Styling                   | ^3.0    |
| **Balkan JS**   | Family tree visualization | Latest  |

---

## 📖 Usage Guide

### 🔐 **Getting Started**

1. **Create Account** - Register with your email and basic information
2. **Verify Email** - Check your inbox and verify your account
3. **Login** - Access your personal family tree dashboard

### 👥 **Building Your Tree**

1. **Add Yourself** - Start with your own information as the root
2. **Add Family Members** - Use the intuitive interface to add:

   * Parents and grandparents
   * Siblings and cousins
   * Children and grandchildren
   * Partners and spouses
3. **Define Relationships** - Specify biological, adopted, step, or foster connections
4. **Add Details** - Include birth dates, locations, occupations, and photos

### 🏥 **Health Tracking**

1. **Medical History** - Record health conditions for each family member
2. **Genetic Markers** - Mark conditions as hereditary when applicable
3. **Health Reports** - Generate AI-powered health analysis reports
4. **Risk Assessment** - Identify potential hereditary health risks

### 📊 **Analysis & Insights**

1. **Health Overview** - Visualize health patterns across generations
2. **Filter & Search** - Find specific conditions or family members
3. **Export Data** - Generate CSV files or PDF reports
4. **Share Insights** - Securely share findings with healthcare providers

---

## 📚 Documentation

| Resource                 | Description                        | Link                                                                                              |
| ------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| 📋 **API Documentation** | Complete backend API reference     | [View Docs](https://drive.google.com/drive/folders/1HHesYEW1SWfEYB-dUbtknCh0Ut1Vei1j?usp=sharing) |
| 🎨 **UI Components**     | Frontend component library         | [View Docs](https://drive.google.com/drive/folders/1HHesYEW1SWfEYB-dUbtknCh0Ut1Vei1j?usp=sharing) |
| 🔧 **Setup Guide**       | Detailed installation instructions | [View Docs](https://drive.google.com/drive/folders/1HHesYEW1SWfEYB-dUbtknCh0Ut1Vei1j?usp=sharing) |
| 🏥 **Health Features**   | Medical tracking documentation     | [View Docs](https://drive.google.com/drive/folders/1HHesYEW1SWfEYB-dUbtknCh0Ut1Vei1j?usp=sharing) |

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🐛 **Bug Reports**

Please include:

* Clear description of the problem
* Steps to reproduce
* Expected vs actual behavior
* Screenshots if applicable

### ✨ **Feature Requests**

Include:

* Detailed description of the feature
* Use case and benefits
* Any mockups or examples

### 💻 **Code Contributions**

1. **Fork** the repository
2. **Create** a feature branch

```shell
git checkout -b feature/amazing-feature
```

3. **Commit** your changes

```shell
git commit -m 'Add amazing feature'
```

4. **Push** to your branch

```shell
git push origin feature/amazing-feature
```

5. **Open** a Pull Request

### 📝 **Development Guidelines**

* Follow TypeScript best practices
* Write tests for new features
* Update documentation as needed
* Follow the existing code style
* Keep commits atomic and well-described

---

## 📞 Support

Need help? We're here for you!

* 📧 **Email**: [support@treetrace.com](mailto:support@treetrace.com)
* 💬 **Discord**: [Join our community](https://discord.gg/treetrace)
* 📖 **Documentation**: [Full documentation](https://docs.treetrace.com)
* 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/treetrace/issues)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <h3>🌟 Star us on GitHub if TreeTrace helps preserve your family heritage! 🌟</h3>
  <p>Made with ❤️ by the TreeTrace Team</p>
</div>

---
