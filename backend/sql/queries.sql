-- Top 5 events by registrations
SELECT e.id, e.name, COUNT(r.id) AS total_registrations
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id
GROUP BY e.id, e.name
ORDER BY total_registrations DESC
LIMIT 5;

-- Registrations per month
SELECT
    DATE_TRUNC('month', r.registration_date) AS month,
    COUNT(*) AS total_registrations
FROM registrations r
GROUP BY month
ORDER BY month DESC;
