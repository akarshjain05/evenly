while true; do
  JS_FILE=$(curl -s https://evenly-eight.vercel.app/ | grep -o 'src="/assets/index-[^"]*\.js"' | cut -d'"' -f2)
  if curl -s "https://evenly-eight.vercel.app$JS_FILE" | grep -q "temp-"; then
    echo "Deployment successful!"
    break
  fi
  echo "Still waiting..."
  sleep 5
done
