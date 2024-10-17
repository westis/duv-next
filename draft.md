# DUV Ultramarathon Statistics Website - Product Requirements Document (PRD)

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technologies Used](#technologies-used)
3. [Core Functionalities](#core-functionalities)
4. [API Documentation](#api-documentation)
5. [Current File Structure](#current-file-structure)
6. [Additional Requirements](#additional-requirements)
7. [Naming Conventions and Style Guide](#naming-conventions-and-style-guide)
8. [Accessibility, Localization, and SEO](#accessibility-localization-and-seo)

---

## Project Overview

The DUV Ultramarathon Statistics website aims to present events, results, and statistics about ultramarathon events. The website will provide users with comprehensive data on ultramarathon events worldwide, including event listings, detailed results, athlete profiles, and statistical toplists.

---

## Technologies Used

- **Framework**: Next.js 14+ (using the App Router)
- **Language**: TypeScript (`.ts` and `.tsx` files)
- **UI Libraries**: Tailwind CSS, shadcn/ui (React components)
- **Icons**: React Icons with Heroicons
- **Data Fetching**:
  - **Server Components**: Fetch API for data fetching in server components
  - **Client Components**: `useEffect` for client-side data fetching
- **Routing**: Next.js App Router (`/app` directory)
- **Deployment**: Vercel
- **Version Control**: Git
- **Package Manager**: npm or yarn

---

## Core Functionalities

### 1. Events Listing

#### 1.1. List All Events

- **Description**: Display a table of all ultramarathon events, filtered by parameters such as future or past events.
- **Endpoint**: `/api/events`
- **Parameters**:
  - `year` (optional): `"futur"` for future events, `"past"` (default) for past events. `year` and `from`/`to` cannot be used simultaneously.
  - `from` and `to` (optional): Date range for events. Must be used together and cannot be used with `year`.
  - `order` (optional): `"asc"` for ascending order (default for future events), `"desc"` for descending order (default for past events).
    - If `from` and `to` span both past and future events, `order` defaults to `"desc"`.
  - Other optional filters: `eventType`, `country`, `rproof`, `norslt`.

#### 1.2. Event Filters

- **Filters at the Top**:
  - **Event Type**: Let the user select event type (Fixed Distance, Fixed Time, Backyard Ultra, Stage Race, Walking, Other, with All being the default). If other than All, other filters below may be shown conditionally.
  - **Date Range**: `from` and `to` parameters.
  - **Distance Slider**: For fixed-distance events only, with a range for distance.
  - **Duration**: Applicable for fixed-time events only.
  - **Surface**: Applicable for fixed-distance or fixed-time events.
  - **Country**: Country selector.
  - **Checkboxes**:
    - **Record Eligible**: Filter events that are eligible for records (`rproof`).
    - **With Results**: Filter events that have results available (`norslt`).

#### 1.3. Events Table

- **Columns**:
  - **Date**: Displayed with a calendar icon.
  - **Event Name**
  - **Distance/Duration**: Displayed with color-coded badges.
  - **Type**: Displayed with color-coded badges.
  - **Location**: Displayed with a location icon.
  - **Actions**:
    - **Details**: Link to the event details page.
    - **Results**: Link to the results for that event.
- **Features**:
  - **Tooltips**: For badges to provide additional information.
  - **Pagination**: Located below the table with options to select the number of events per page.

#### 1.4. Menu Navigation

- **Events Menu**:
  - **Calendar**: Navigates to events page with `from` set to today's date and `to` set to one year from today.
  - **Results**: Navigates to events page with `from` set to one year ago and `to` set to today's date.

#### 1.5. URL Parameters and Filters Synchronization

- All filters, including date range, sort order, and other filter options, must be synchronized across:
  1. URL parameters
  2. Filter components on the page
  3. Navigation menu links (Calendar and Results)
- When a user navigates to the events page:
  - If URL parameters are present, they should be used to set the initial filter states.
  - If no URL parameters are present, default filters should be applied (e.g., upcoming year for Calendar, past year for Results).
- When filters are changed on the page:
  - The URL should be updated to reflect the new filter states.
  - The filter components should update accordingly.
- When Calendar or Results are clicked in the navigation menu:
  - The URL should be updated with the appropriate parameters.
  - The page should reload with the new filters applied.
  - The filter components should reflect the new filter states.
- The sort order (ascending or descending) should be consistent with the selected date range:
  - Ascending for future events (Calendar)
  - Descending for past events (Results)
- Any manual changes to the URL parameters should trigger a re-fetch of data and update of filter components.

#### 1.6. API Call Notes

- **Parameter Optimization**: Exclude parameters in API calls that have no values to optimize requests.

### 2. Event Results Table

- **Display**: Show results for each event.
- **Columns**:
  - **Rank**
  - **Performance**: Time in `h:mm:ss` or distance in kilometers with three decimals.
  - **Name**
  - **Club**
  - **Nationality (Nat.)**
  - **Year of Birth (YOB)**
  - **Sex**

### 3. Toplists

#### 3.1. Filters

- **Discipline**: 50km, 100km, 6h, 12h, 24h, 48h, 72h, 6d.
- **Year**: "All" for all-time performances or specific years.
- **Gender**: All, M (Male), F (Female).
- **Age Group**: All, WU23, W23, W35, W40, etc., for women and corresponding categories for men.
- **Country**: "World", regions for each continent, and individual countries.
- **IAU Label**: Checkbox to filter by International Association of Ultrarunners (IAU) label events.

#### 3.2. Toplists Table

- **Columns**:
  - **Rank**
  - **Performance**
  - **Name**
  - **Nationality (Nat.)**
  - **Date of Birth (DOB)**: Use YOB if DOB is not available.
  - **Category (Cat.)**: Age group.
  - **Date**: Date of the event.
  - **Location**: Event location.

### 4. Menu Structure

- **Events**
  - **Calendar**: `/events?year=futur`
  - **Results**: `/events?year=past`
  - **Championships**: `/championships`
- **Statistics**
  - **Toplists**: `/toplists`
  - **Records**: `/records`
  - **Country Stats**: `/countrystats`
- **About**
  - **About DUV**: `/about`
  - **What's New**: `/whatsnew`
  - **FAQ**: `/faq`
  - **Credits**: `/credits`
  - **Contact**: `/contact`

### 5. Navbar

- **Logo**: Positioned on the left.
- **Menu Navigation**: Centered, using shadcn/ui components.
- **Search Bar**: Always displayed; searches runners, events, clubs, or pages on the site.
- **Theme Toggle**: For switching between light and dark modes.

### 6. Dark Mode Support

- **Implementation**: All color classes should have a `dark:` equivalent for dark mode compatibility.

### 7. Responsiveness

- **Design**: The website should be fully responsive.
- **Mobile Navigation**: Use a hamburger menu on mobile devices.

---

## API Documentation

The DUV Ultramarathon Statistics website uses several API endpoints to fetch data. Each endpoint has corresponding HTML and JSON versions. The JSON versions are located in the `/json/` subfolder and prefixed with 'm'.

**Base URL**: `https://statistik.d-u-v.org/`

The API endpoints and their parameters remain the same as described in the original PRD.

---

## Current File Structure

```
|-- app
|   |-- layout.tsx
|   |-- page.tsx
|   |-- events
|       |-- page.tsx
|       |-- loading.tsx
|   |-- api
|       |-- events
|           |-- route.ts
|       |-- eventDetail
|           |-- route.ts
|       |-- athleteProfile
|           |-- route.ts
|       |-- raceResults
|           |-- route.ts
|       |-- rankings
|           |-- route.ts
|       |-- searchEvent
|           |-- route.ts
|       |-- topRankingsAbroad
|           |-- route.ts
|
|-- components
|   |-- hero.tsx
|   |-- the-navbar.tsx
|   |-- event-filter.tsx
|   |-- event-list.tsx
|   |-- ui
|       |-- badge.tsx
|       |-- button.tsx
|       |-- card.tsx
|       |-- checkbox.tsx
|       |-- command.tsx
|       |-- dialog.tsx
|       |-- navigation-menu.tsx
|       |-- pagination.tsx
|       |-- popover.tsx
|       |-- range-calendar.tsx
|       |-- select.tsx
|       |-- slider.tsx
|       |-- table.tsx
|       |-- tooltip.tsx
|
|-- lib
|   |-- utils.ts
|
|-- public
|   |-- duv_logo_with_name.png
|   |-- duv_logo_with_name_white.png
|   |-- favicon.ico
|   |-- robots.txt
|
|-- styles
|   |-- globals.css
|
|-- next.config.ts
|
|-- tsconfig.json
|
|-- package.json
|
|-- tailwind.config.ts
```

---

## Additional Requirements

### 1. Project Setup

- **Data Fetching**:
  - All data fetching should be done in **Server Components** using the Fetch API.
    - Since all components in the `/app` directory are Server Components by default, data fetching can be done directly in these components.
  - **Client Components** (using `useState`, `useEffect`, or other hooks) should have `'use client'` at the top of the file.
    - Use `useEffect` for client-side data fetching if necessary.
- **API Routes**:
  - Create API routes in the `/app/api` directory using Next.js App Router conventions.
  - Use `route.ts` or `route.js` files to define API endpoints.
  - API routes can be used to fetch data from external APIs if needed.
- **Avoid External Libraries for Fetching**:
  - Use the built-in Fetch API for data fetching.
  - Do not use Axios or other external libraries for HTTP requests.
- **Deployment**:
  - Use Vercel for deployment.
  - Ensure that the application is optimized for Vercel's serverless environment.
- **Routing**:
  - Use the new App Router structure in the `/app` directory.
  - Utilize dynamic segments and layouts as per Next.js 14+ conventions.

### 2. Environment Variables

- **Sensitive Information**:
  - Store all sensitive information (API keys, credentials) in environment variables.
- **Local Development**:
  - Use a `.env.local` file for local development and ensure it's listed in `.gitignore`.
- **Production Environment**:
  - Set environment variables in the Vercel dashboard under the project settings.
- **Next.js Configuration**:
  - Utilize `next.config.ts` for environment-specific configuration.
  - Use the `process.env` directly in Server Components without additional configuration.
    - Environment variables can be accessed in both Server and Client Components, but sensitive variables should only be used on the server.
- **TypeScript Configuration**:
  - Use `.ts` and `.tsx` file extensions for all TypeScript files, including `next.config.ts`.

### 3. Error Handling and Logging

- **Comprehensive Error Handling**:
  - Implement error handling in both client-side components and server-side API routes.
  - Use try-catch blocks and handle HTTP errors gracefully.
- **Server-Side Logging**:
  - Log errors on the server-side for debugging purposes.
  - Use Vercel's logging capabilities for production error tracking.
- **User-Friendly Messages**:
  - Display user-friendly error messages on the client-side.
  - Implement loading states and fallback UI where appropriate.
- **Loading UI**:
  - Use `loading.tsx` files in the App Router to display loading states during data fetching.

### 4. Type Safety

- **TypeScript Interfaces**:
  - Use TypeScript interfaces or types for all data structures, especially API responses.
- **Avoid `any` Type**:
  - Do not use the `any` type; define proper types for all variables and function parameters.
- **Strict Mode**:
  - Enable TypeScript strict mode in `tsconfig.json` to enforce type safety.

### 5. Accessibility

- **WCAG Compliance**:
  - Ensure all color combinations and UI elements meet WCAG 2.2 Level AAA guidelines for color contrast.
- **General Accessibility**:
  - Ensure the website meets at least Level AA criteria for other accessibility considerations.
- **Semantic HTML**:
  - Use semantic HTML tags to improve accessibility.
- **Testing**:
  - Use accessibility testing tools like Lighthouse or axe to validate compliance.

### 6. Localization

- **Multi-Language Support**:
  - The website should support multiple languages.
- **Default Language**: English.
- **Additional Languages**: German, French, Spanish, Italian, Russian, Chinese, Japanese, and Swedish.
- **Implementation**:
  - Use Next.js internationalized routing for localization.
  - Prepare components and pages to support localization using appropriate i18n practices.
  - Store translations in separate JSON files and use a library like `next-i18next` or `react-intl` for managing translations.
- **Date and Number Formats**:
  - Adapt date and number formats according to the selected locale.

### 7. SEO

- **SEO-Friendly**:
  - Optimize the website for search engines.
- **Metadata API**:
  - Use Next.js 14+ Metadata API instead of the `<Head>` component for setting meta tags.
    - Define `metadata` objects in page components to set `title`, `description`, and other meta tags.
- **Sitemap**:
  - Generate and include a sitemap using Next.js plugins or custom scripts.
- **Google Tag Manager**:
  - Integrate Google Tag Manager to track website traffic.
- **Performance Optimization**:
  - Optimize images using the Next.js `<Image />` component from `next/image`.
  - Utilize code splitting and lazy loading where appropriate.
- **Robots.txt and Sitemap**:
  - Include a `robots.txt` file and generate a sitemap for search engines.
- **Dynamic Routing**:
  - Use Next.js dynamic routes for SEO-friendly URLs.
- **Structured Data**:
  - Implement JSON-LD structured data where applicable.

---

## Naming Conventions and Style Guide

### Component Names

- **File Naming**:
  - Use lowercase and hyphens for filenames (e.g., `event-list.tsx`).
- **Component Naming**:
  - Use PascalCase for component names inside the file (e.g., `EventList`).
- **Multi-Word Names**:
  - All component names should be multi-word to avoid conflicts with HTML elements.
- **Folder Structure**:
  - Components are stored in `/components` at the root level.
- **Base Components**:
  - Components that apply app-specific styling and conventions should begin with a specific prefix, such as `Base`, `App`, or `V` (e.g., `BaseButton.tsx`).
- **Singleton Components**:
  - Components that should only ever have a single active instance should begin with the `The` prefix (e.g., `TheNavbar.tsx`).
- **Child Components**:
  - Components tightly coupled with their parent should include the parent component name as a prefix (e.g., `EventFilter.tsx` as a child of `EventList.tsx`).
- **Name Structure**:
  - Start component names with the highest-level (most general) words and end with descriptive modifying words.
- **Full Words Over Abbreviations**:
  - Prefer full words over abbreviations in component names.

### Style Guide

- **React and Next.js Best Practices**:
  - Follow React and Next.js best practices for component design and state management.
- **Code Formatting**:
  - Use Prettier and ESLint for code formatting and linting.
- **Hooks Usage**:
  - Use React Hooks according to the Rules of Hooks.
- **State Management**:
  - Use React's built-in state management (`useState`, `useReducer`) unless a more complex solution is necessary.
- **TypeScript Practices**:
  - Follow TypeScript best practices, including proper typing and avoiding the use of `any`.
- **Next.js Conventions**:
  - Utilize Next.js features like dynamic routes, layouts, and the new App Router structure.

---

## Accessibility, Localization, and SEO

### Accessibility

- **Color Contrast**:
  - Ensure all text and background color combinations meet WCAG 2.2 Level AAA standards.
- **Keyboard Navigation**:
  - All interactive elements should be accessible via keyboard.
- **ARIA Labels**:
  - Use appropriate ARIA labels and roles for UI components.
- **Semantic HTML**:
  - Use semantic HTML tags to improve accessibility.
- **Testing**:
  - Use accessibility testing tools like Lighthouse or axe to validate compliance.

### Localization

- **Language Files**:
  - Store translations in separate JSON files for each language (e.g., `en.json`, `de.json`).
- **Dynamic Content**:
  - Ensure that all dynamic content is translatable.
- **Date and Number Formats**:
  - Adapt date and number formats according to the selected locale.
- **Implementation**:
  - Use libraries like `next-i18next` or `react-intl` for internationalization.
  - Utilize Next.js internationalized routing features.

### SEO

- **Metadata API**:
  - Use Next.js 14+ Metadata API to include `title`, `description`, and `keywords` meta tags for each page.
- **Canonical URLs**:
  - Use canonical tags to prevent duplicate content issues.
- **Structured Data**:
  - Implement JSON-LD structured data where applicable.
- **Performance Optimization**:
  - Optimize images and assets to improve page load times.
- **Robots.txt and Sitemap**:
  - Include a `robots.txt` file and generate a sitemap for search engines.
- **Dynamic Routing**:
  - Use Next.js dynamic routes for SEO-friendly URLs.
- **Image Optimization**:
  - Use the new `<Image />` component from `next/image` for image optimization.

---

## Conclusion

This PRD provides a comprehensive overview of the DUV Ultramarathon Statistics website project using Next.js, incorporating the latest Next.js 14+ features and best practices. It includes detailed descriptions of core functionalities, API endpoints, current file structure, additional requirements, and guidelines for naming conventions, style, accessibility, localization, and SEO. The aim is to ensure clear alignment among developers and stakeholders to facilitate efficient development and implementation of the project.
