# 🚀 CodeChef API

<div align="center">

![CodeChef API Banner](https://socialify.git.ci/shivam-smraj/CodeChef-API/image?description=1&font=Inter&language=1&name=1&owner=1&pattern=Circuit%20Board&theme=Dark)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4-blue.svg)](https://expressjs.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**The most powerful, high-performance unofficial API for CodeChef.**  
Build leaderboards, analytics dashboards, and stunning portfolios in minutes.

[**View Demo / Documentation**](https://sm-codechef.vercel.app)

</div>

---

## ✨ Features

- **⚡ Blazing Fast:** Powered by `cheerio` for rapid HTML parsing and `node-cache` for sub-millisecond response times on repeated requests.
- **📊 Leaderboard Ready:** Fetch data for up to **100 users** in a single API call.
- **🎯 Granular Filtering:** Request only the specific fields you need (e.g., just `rating` and `stars`) to save bandwidth.
- **🖼️ Embeddable Widgets:** Beautiful, copy-paste ready Heatmap and Rating Graph widgets for your personal site.
- **🛡️ Rate Limited:** Built-in protection against abuse (1000 req/min).

---

## 🔗 API Reference

**Base URL:** `https://sm-codechef.vercel.app`

### 1. Get User Profile (Full Data)
Fetches comprehensive data for a single user, including ranks, ratings, submission heatmap, and full rating history.

#### Request
```http
GET /handle/{username}
```

#### Example
`https://sm-codechef.vercel.app/handle/gennady.korotkevich`

#### Response
```json
{
  "success": true,
  "status": 200,
  "name": "Gennady Korotkevich",
  "currentRating": 3979,
  "highestRating": 3979,
  "stars": "7★",
  "globalRank": 1,
  "countryRank": 1,
  "totalProblemsSolved": 1680,
  "contestCount": 85,
  "profile": "https://cdn.codechef.com/sites/...",
  "heatMap": [...],
  "ratingData": [...]
}
```

---

### 2. Get Specific Fields (Granular Data) 🆕
Optimize your application by fetching only the data you need.

#### Request
```http
GET /handle/{username}?fields={field1},{field2}...
```

#### Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `fields` | `string` | Comma-separated list of fields to return. |

**Available Fields:** `name`, `currentRating`, `highestRating`, `stars`, `globalRank`, `countryRank`, `totalProblemsSolved`, `contestCount`, `profile`, `countryName`, `lastRatingChange`.

#### Example
`https://sm-codechef.vercel.app/handle/neal?fields=currentRating,stars,globalRank`

#### Response
```json
{
  "success": true,
  "status": 200,
  "currentRating": 2650,
  "stars": "6★",
  "globalRank": 12
}
```

---

### 3. Bulk User Fetch (Leaderboard API) 🏆
Perfect for college clubs and organizations. Fetch lightweight summaries for multiple users in parallel.

#### Request
```http
GET /api/users?handles={handle1},{handle2}...
```

#### Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `handles` | `string` | Comma-separated list of CodeChef handles (Max 100). |

#### Example
`https://sm-codechef.vercel.app/api/users?handles=neal,gennady.korotkevich,tmwilliamlin`

#### Response
```json
{
  "success": true,
  "users": [
    {
      "name": "Neal Wu",
      "currentRating": 2650,
      "stars": "6★",
      "success": true
    },
    {
      "name": "Gennady Korotkevich",
      "currentRating": 3979,
      "stars": "7★",
      "success": true
    }
  ]
}
```

---

### 4. Specific Data Endpoints
Helper endpoints if you only need specific large datasets.

| Endpoint | Description |
| :--- | :--- |
| `GET /api/rating/{username}` | Returns only the array of rating changes (contest history). |
| `GET /api/heatmap-data/{username}` | Returns only the daily submission counts (heatmap data). |

---

## 🎨 Embeddable Widgets

Add these iframes directly to your GitHub profile or personal website.

### 🔥 Submission Heatmap
Displays the user's daily activity over the last year.

```html
<iframe src="https://sm-codechef.vercel.app/heatmap/{handle}?theme=night" width="100%" height="200"></iframe>
```
**Options:**
- `theme`: `day` (light) or `night` (dark). Default is `day`.

### 📈 Rating Graph
Displays the user's rating progression over time.

```html
<iframe src="https://sm-codechef.vercel.app/rating/{handle}" width="100%" height="400"></iframe>
```

---

## 🛠️ Local Installation

Want to host it yourself? Follow these steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/shivam-smraj/CodeChef-API.git
   cd Codechef-API
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   The server will start on `http://localhost:3000`.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## 💖 Author

Made with ❤️ by [**shivam-smraj**](https://github.com/shivam-smraj)

---
*Disclaimer: This is an unofficial API and is not affiliated with CodeChef.*



