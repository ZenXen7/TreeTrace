# TreeTrace

TreeTrace is a web-based family tree platform that enables users to build, manage, and visualize their family history interactively. It supports real-time collaboration, multiple visualization modes, hereditary health tracking, and powerful filtering and search features to easily navigate large genealogies. 

---

## Overview

TreeTrace allows you to:
- Create and manage detailed family trees
- Track complex relationships (biological, adopted, step, foster)
- Record and visualize health conditions across generations
- Analyze hereditary health risks and trends
- Securely manage and share your family data

## Documentation

[Documentations](https://drive.google.com/drive/folders/1HHesYEW1SWfEYB-dUbtknCh0Ut1Vei1j?usp=sharing)

## Tech Stack

The project uses a robust, modern stack for scalability, security, and ease of development.

### Backend

- ![NestJS](https://nestjs.com/img/logo-small.svg) **NestJS** (Node.js framework)
- ![MongoDB](https://webassets.mongodb.com/_com_assets/cms/mongodb_logo1-76twgcu2dm.png) **MongoDB** (NoSQL database)
- ![TypeScript](https://raw.githubusercontent.com/remojansen/logo.ts/master/ts.png) **TypeScript** (type safety)
- **Mongoose** (MongoDB ODM)
- **JWT** (JSON Web Token for authentication)

### Frontend

- ![React](https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg) **React** (or Next.js, depending on your setup)
- **TypeScript**
- **Modern UI libraries** (e.g., Material-UI, Chakra UI, or Ant Design)

## Usage Guide

1. **Register and Login:**  
   Create an account and log in to access your private family tree.

2. **Add Family Members:**  
   Use the interface to add parents, children, partners, and extended relatives. Specify relationship types for accuracy.

3. **Track Health Data:**  
   For each member, add health conditions, diagnosis dates, severity, status, and notes. Mark conditions as genetic if applicable.

4. **Visualize and Analyze:**  
   View your family tree graphically. Use the health overview dashboard to see trends, filter by condition, and export data.

5. **Security:**  
   All data is protected by JWT authentication. You control which members are public or private.

---

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature-name'`
4. Push to your branch: `git push origin feature-name`
5. Submit a pull request.
