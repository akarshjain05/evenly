while true; do
  RES=$(curl -s https://evenly-eight.vercel.app/api/admin/migrate)
  if [[ "$RES" == *"migrated"* ]]; then
    echo "Migration successful!"
    break
  fi
  echo "Still waiting..."
  sleep 5
done
