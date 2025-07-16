
# Sybase to Oracle Migration Tool

## Overview
This project is an AI-powered migration tool that helps convert Sybase database code to Oracle-compatible syntax. It features Gemini AI integration for enhanced conversion accuracy and performance.

## Features
- Code upload and analysis
- AI-powered conversion with multiple model options
- Detailed code review with side-by-side comparison
- Comprehensive migration reports
- Direct Oracle deployment option
- Batch file downloading

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Gemini AI integration

## Getting Started

1. Upload your Sybase SQL code files
2. Choose an AI model (Default or Gemini)
3. Start the conversion process
4. Review the converted code and resolve any issues
5. Generate a comprehensive migration report
6. Download or deploy the Oracle-compatible code

## Docker

### Prerequisites
- [Docker](https://www.docker.com/get-started) installed on your system

### Build the Docker image
```sh
docker build -t sybase-oracle .
```

### Run the Docker container
```sh
docker run -p 8080:80 sybase-oracle
```

The application will be available at [http://localhost:8080](http://localhost:8080)
