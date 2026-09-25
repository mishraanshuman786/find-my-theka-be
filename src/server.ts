import "dotenv/config";
import app from "./app";


const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Find My Theka Server running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}`);
});