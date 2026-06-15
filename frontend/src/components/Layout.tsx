import { Link, Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tab,
  Tabs,
} from "@mui/material";

const NAV_ITEMS = [
  { label: "Events", path: "/" },
  { label: "New Event", path: "/new" },
  { label: "Stats", path: "/stats" },
];

export default function Layout() {
  const location = useLocation();
  const tab = NAV_ITEMS.findIndex((item) =>
    item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.100" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ mr: 4 }}>
            Eventoon
          </Typography>
          <Tabs
            value={tab === -1 ? false : tab}
            textColor="inherit"
            indicatorColor="secondary"
          >
            {NAV_ITEMS.map((item) => (
              <Tab
                key={item.path}
                label={item.label}
                component={Link}
                to={item.path}
              />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
