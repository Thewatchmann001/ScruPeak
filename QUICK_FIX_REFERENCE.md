# 🚀 Quick Fix Reference - Copy/Paste Solutions

## Problem Summary
```
CORS Error: Access-Control-Allow-Origin header missing
Privy Error: Iframe failed to load, exceeded max attempts
Frontend: Can't call API, can't login with Privy
Production: https://api-gateway-prod-kqr3pbuu3a-uc.a.run.app blocked
```

---

## ⚡ The 3 Key Fixes

### Fix #1: API Gateway - Pass CORS Headers Through Proxy
**File:** `apps/api-gateway/src/index.js`

**Key addition:**
```javascript
const proxyOptions = {
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    const origin = userReq.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      userRes.setHeader('Access-Control-Allow-Origin', origin);
      userRes.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    return proxyResData;
  },
};

app.use('/api/v1', proxy(services.core, {
  ...proxyOptions,
  proxyReqPathResolver: (req) => '/api/v1' + req.url,
}));
```

### Fix #2: Nginx - Add CSP Headers + Preflight Handling
**File:** `apps/web/nginx.conf`

**Key additions:**
```nginx
# CSP header allowing Privy
add_header Content-Security-Policy "frame-ancestors 'self' https://auth.privy.io https://embedded.privy.io" always;

# Handle OPTIONS (preflight) requests
if ($request_method = 'OPTIONS') {
  add_header 'Access-Control-Allow-Origin' $http_origin;
  add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD';
  add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,x-privy-token';
  add_header 'Access-Control-Allow-Credentials' 'true';
  return 204;
}
```

### Fix #3: Environment Variables - Add ALLOWED_ORIGINS
**File:** `.env` (API Gateway)

```bash
ALLOWED_ORIGINS=https://web-prod-kqr3pbuu3a-uc.a.run.app,https://web-prod-1090857402667.us-central1.run.app,http://localhost:3000
CORE_SERVICE_URL=https://backend-prod-kqr3pbuu3a-uc.a.run.app
```

---

## 🧪 Verify Fixes Work

### Test 1: CORS Headers
```bash
curl -v https://api-gateway-prod-kqr3pbuu3a-uc.a.run.app/health
# Look for: Access-Control-Allow-Origin header in response
```

### Test 2: Preflight Request
```bash
curl -X OPTIONS -v https://api-gateway-prod-kqr3pbuu3a-uc.a.run.app/land \
  -H "Origin: https://web-prod-kqr3pbuu3a-uc.a.run.app" \
  -H "Access-Control-Request-Method: GET"
# Should return 204 with CORS headers
```

### Test 3: Frontend Browser
```
1. Open https://web-prod-kqr3pbuu3a-uc.a.run.app
2. Open DevTools (F12)
3. Go to Network tab
4. Click "Browse Lands"
5. Find request to /land
6. Check Response Headers → Access-Control-Allow-Origin
7. Should see: Access-Control-Allow-Origin: https://web-prod-...
```

### Test 4: Privy Login
```
1. Click "Login" button
2. Check DevTools → Console
3. Should NOT see "Privy iframe failed to load"
4. Should NOT see "Exceeded max attempts"
5. Privy modal should appear
```

---

## 📋 Deployment Checklist

- [ ] All code changes applied to these files:
  - [ ] `apps/api-gateway/src/index.js`
  - [ ] `apps/web/nginx.conf`
  - [ ] `apps/web/index.html`
  - [ ] `apps/web/vite.config.ts`
  - [ ] `apps/web/src/main.tsx`

- [ ] Environment variables set:
  - [ ] API Gateway: `ALLOWED_ORIGINS` set to correct domains
  - [ ] Web Frontend: `VITE_API_URL` set to correct API gateway URL

- [ ] Docker images rebuilt and pushed:
  - [ ] `docker build apps/api-gateway -t api-gateway:latest`
  - [ ] `docker build apps/web -t web-frontend:latest`

- [ ] Cloud Run services redeployed:
  - [ ] `gcloud run deploy api-gateway ...`
  - [ ] `gcloud run deploy web-frontend ...`

- [ ] Privy dashboard updated:
  - [ ] Added frontend domain to whitelisted origins
  - [ ] Embedded wallets configured for production domain

- [ ] Testing passed:
  - [ ] CORS header test (curl)
  - [ ] Preflight request test (curl)
  - [ ] Frontend API calls (browser)
  - [ ] Privy login (browser)
  - [ ] List lands (browser)
  - [ ] Register as agent (browser)
  - [ ] Create land listing (browser)

---

## 🆘 Troubleshooting

### Still seeing CORS errors?
1. **Check env vars:**
   ```bash
   gcloud run services describe api-gateway --region us-central1
   # Look for ALLOWED_ORIGINS value
   ```

2. **Check nginx config:**
   ```bash
   curl -H "Origin: https://web-prod-..." -v https://api-gateway-prod.../health
   # Should include Access-Control-Allow-Origin header
   ```

3. **Restart services:**
   ```bash
   gcloud run deploy api-gateway --image gcr.io/.../api-gateway:latest
   gcloud run deploy web-frontend --image gcr.io/.../web-frontend:latest
   ```

### Privy iframe still not loading?
1. **Clear browser cache:** `Ctrl+Shift+Delete`
2. **Check Privy dashboard:** https://dashboard.privy.io/apps/cmmxpr19800000cl51l48f0yv/settings/domains
3. **Add domain:** Add `https://web-prod-...` to whitelisted domains
4. **Check CSP header:** DevTools → Network → Find HTML request → Response Headers
5. **Restart browser:** Close all tabs, reopen

### API returns 500?
1. **Check backend service:** `gcloud run services list`
2. **Check logs:** `gcloud run logs read backend-prod --limit 20`
3. **Verify CORE_SERVICE_URL:** `curl https://backend-prod.../health`

---

## 📞 Quick Support

| Issue | Command |
|-------|---------|
| Check API health | `curl https://api-gateway-prod.../health` |
| Check API logs | `gcloud run logs read api-gateway --limit 50` |
| Check web logs | `gcloud run logs read web-frontend --limit 50` |
| List services | `gcloud run services list` |
| View service details | `gcloud run services describe api-gateway --region us-central1` |
| Redeploy service | `gcloud run deploy api-gateway --image <image>` |

---

## ✅ Success Criteria

When all fixes are applied and deployed:

✅ Frontend loads without CORS errors  
✅ Can click "Browse Lands" and see listings  
✅ Can login with Privy (email/Google/wallet)  
✅ Can register as agent or land owner  
✅ Can create and list land properties  
✅ Can initiate payment (card/mobile money)  
✅ No console errors in DevTools  
✅ No warnings about CSP violations  

**Result:** MVP MVP is fully functional on production! 🚀

