# User Management API + Full Stack DevOps by implementing Infrastructure as Code (IaC)
![users-rest-api-devops](https://github.com/user-attachments/assets/2096a2d8-920c-43cd-af2b-6404629fa987)


This project demonstrates how to deploy a web application using Infrastructure as Code (IaC) (via Terraform), Kubernetes (EKS), CI/CD (GitHub Actions), NGINX Ingress, and setup monitoring + alerting (Prometheus, Grafana, Alertmanager).

- **To view the full documentation, please visit the following link**: [Medium Article](https://medium.com/@unosega/implementation-of-infrastructure-as-code-iac-to-deploy-a-web-app-using-terraform-kubernetes-and-6de2b820c06e)
- **Web App URL**: https://portproject.my.id/users/api-docs

> *Swagger is configured in `utils/swagger.js` and points at the base paths above.*

> *Note: Many services in this project are under AWS Free Tier + $100 credit. The domain/app may stop working later due to limits. Use this mainly as a learning guide.*

## Project Overview
High-level flow:
- Developer pushes code to GitHub → triggers GitHub Actions pipeline
- Infrastructure (EKS cluster, VPC, ECR, etc.) is provisioned via Terraform
- Application is containerized and deployed into EKS
- NGINX Ingress Controller serves as the gateway / reverse proxy and automatically gets an AWS ELB
- Domain DNS points to the ELB so the application becomes publicly accessible
- Metrics and logs are collected via Prometheus, visualized in Grafana
- Alertmanager sends alerts (e.g. via Gmail) when something goes wrong

<img width="4485" height="2998" alt="REST API User - IaC DevOps" src="https://github.com/user-attachments/assets/238e2d2f-34c9-443d-80dc-0e8b5206bce6" />


## Prerequisites
- AWS account (with Free Tier + $100 credit)
- Domain name (e.g. portproject.my.id), with DNS control (Cloudflare used in example)
- Docker installed locally and basic knowledge of Docker, Kubernetes, YAML, Terraform
- Git & GitHub repository

## Folder Structure
<img width="287" height="835" alt="image" src="https://github.com/user-attachments/assets/5e3aa9d4-3c02-49aa-8b36-6050eaaf1d24" />

## Infrastructure Provisioning (Terraform)
### Installation & Setup
- Install Terraform (e.g. via choco install terraform -y on Windows)
- Configure AWS CLI: aws configure (enter your AWS Access Key, Secret Key, region, output)

### Terraform Files
- main.tf includes:
  - AWS provider setup
  - AWS ECR repository
  - VPC via terraform-aws-modules/vpc
  - EKS cluster via terraform-aws-modules/eks
  - Node groups and IAM roles
  - Outputs (ECR URL, cluster name)
- variables.tf defines variables like aws_region, project_name, cluster_name, ecr_repository_name, terraform_admin_role_arn, etc.
- terraform.tfvars sets actual values (e.g. IAM role ARN for Terraform admin)

```bash
cd terraform
terraform init
terraform plan
terraform apply
```
Terraform will create the infrastructure (VPC, subnets, EKS, ECR, etc.), which may take ~15–30 minutes.

To destroy everything:
```bash
terraform destroy
```

## Kubernetes Configuration
In the k8s/ folder, these manifests define how the application runs inside EKS:
- configmap.yaml:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: restapi-users-config
data:
  PORT: "5000"
  NODE_ENV: "production"
  DEFAULT_CLIENT_URL: "http://localhost:5173"
  INTERNET_SERVER: "http://localhost:5000"
```

- deployment.yaml:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: restapi-users-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: restapi-users
  template:
    metadata:
      labels:
        app: restapi-users
    spec:
      containers:
        - name: restapi-users-container
          image: IMAGE_PLACEHOLDER
          ports:
            - containerPort: 5000
          envFrom:
            - configMapRef:
                name: restapi-users-config
            - secretRef:
                name: restapi-users-secrets
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "250m"
          readinessProbe:
            httpGet:
              path: /healthz
              port: 5000
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /healthz
              port: 5000
            initialDelaySeconds: 15
            periodSeconds: 20
```

- service.yaml:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: restapi-users-service
spec:
  selector:
    app: restapi-users
  ports:
    - protocol: TCP
      port: 80 # Service port
      targetPort: 5000 # Port in the container
  type: ClusterIP
```

- ingress.yaml:
```yaml
# k8s/ingress.yaml

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: restapi-users-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: __INGRESS_HOSTNAME__
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: restapi-users-service
                port:
                  number: 80
```

> In CI/CD pipeline, `__INGRESS_HOSTNAME__` is replaced with your real domain (e.g. portproject.my.id).

## CI/CD with GitHub Actions
### Secrets & Variables
In your GitHub repo, navigate to Settings → Secrets & variables → Actions, and add:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (e.g. ap-southeast-2)
- ECR_REPOSITORY (e.g. restapi-users)
- INGRESS_HOSTNAME (your domain)
- And other secret variables stored in the `.env` file inside your project folder.

### Workflow (cicd.yml)
```yaml
name: CI/CD Pipeline for REST API Users

on:
  push:
    branches:
      - master
  pull_request:
    branches:
      - master
  workflow_dispatch:

env:
  AWS_REGION: ap-southeast-2
  ECR_REPOSITORY: restapi-users
  EKS_CLUSTER_NAME: restapi-users-cluster
  K8S_DEPLOYMENT_NAME: restapi-users-deployment
  INGRESS_HOSTNAME: portproject.my.id

jobs:
  build:
    name: Build, Test and Push
    runs-on: ubuntu-latest

    outputs:
      image: ${{ steps.build-image.outputs.image }}

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install Dependencies
        run: npm install

      - name: Run Unit Tests
        run: npm test

      - name: Build and tag the Docker image
        id: build-image
        run: |
          IMAGE_TAG=${{ github.sha }}-${{ github.run_number }}
          docker build -t ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${IMAGE_TAG} .
          echo "image=${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${IMAGE_TAG}" >> $GITHUB_OUTPUT

      - name: Scan Docker Image with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.build-image.outputs.image }}
          format: "table"
          exit-code: "1"
          ignore-unfixed: true
          vuln-type: "os,library"
          severity: "CRITICAL"

      - name: Push image to Amazon ECR
        run: docker push ${{ steps.build-image.outputs.image }}

  deploy:
    name: Deploy to Staging (EKS)
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Set up Kubeconfig
        run: aws eks update-kubeconfig --name ${{ env.EKS_CLUSTER_NAME }} --region ${{ env.AWS_REGION }}

      - name: Update Ingress manifest with correct hostname
        run: sed -i "s|__INGRESS_HOSTNAME__|${{ env.INGRESS_HOSTNAME }}|g" k8s/ingress.yaml

      - name: Apply Kubernetes non-secret manifests
        run: |
          kubectl apply -f k8s/configmap.yaml
          kubectl apply -f k8s/deployment.yaml
          kubectl apply -f k8s/service.yaml
          kubectl apply -f k8s/ingress.yaml

      - name: Create or Update Kubernetes Secret
        run: |
          kubectl create secret generic restapi-users-secrets \
            --from-literal=CONNECTION_URL='${{ secrets.CONNECTION_URL }}' \
            --from-literal=DB_NAME='${{ secrets.DB_NAME }}' \
            --from-literal=REFRESH_TOKEN_SECRET='${{ secrets.REFRESH_TOKEN_SECRET }}' \
            --from-literal=ACCESS_TOKEN_SECRET='${{ secrets.ACCESS_TOKEN_SECRET }}' \
            --from-literal=ACTIVATION_TOKEN_SECRET='${{ secrets.ACTIVATION_TOKEN_SECRET }}' \
            --from-literal=DOCKER_USERNAME='${{ secrets.DOCKER_USERNAME }}' \
            --from-literal=DOCKER_PASSWORD='${{ secrets.DOCKER_PASSWORD }}' \
            --from-literal=TUNNEL_NAME='${{ secrets.TUNNEL_NAME }}' \
            --from-literal=EMAIL_USER='${{ secrets.EMAIL_USER }}' \
            --from-literal=EMAIL_PASSWORD='${{ secrets.EMAIL_PASSWORD }}' \
            --dry-run=client -o yaml | kubectl apply -f -

      - name: Update deployment image
        run: kubectl set image deployment/${{ env.K8S_DEPLOYMENT_NAME }} restapi-users-container=${{ needs.build.outputs.image }}

      - name: Verify deployment rollout
        run: kubectl rollout status deployment/${{ env.K8S_DEPLOYMENT_NAME }} --timeout=120s

      - name: Deploy Monitoring Stack
        run: |
          helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
          helm repo update
          helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
            --namespace monitoring \
            -f monitoring/alertmanager-values.yaml \
            --set alertmanager.config.global.resolve_timeout='5m' \
            --set alertmanager.config.global.smtp_from='${{ secrets.GMAIL_USERNAME_MONITORING }}' \
            --set alertmanager.config.global.smtp_smarthost='smtp.gmail.com:587' \
            --set alertmanager.config.global.smtp_auth_username='${{ secrets.GMAIL_USERNAME_MONITORING }}' \
            --set alertmanager.config.global.smtp_auth_password='${{ secrets.GMAIL_APP_PASSWORD_MONITORING }}'
          kubectl apply -f monitoring/my-alert-rules.yaml

```

After pushing commits to GitHub, check the Actions tab to see the workflow run.

## Ingress & DNS Setup
### Install NGINX Ingress via Helm
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace
```
This installs the NGINX Ingress Controller and by default creates a Service of type LoadBalancer (triggering AWS ELB).

Then check:
```bash
kubectl get ingress
```
You should see an address which is the ELB's DNS.

### DNS Update (e.g. via Cloudflare)
- Log in to your DNS provider (Cloudflare in the example)
- Navigate to DNS Records
- Edit or remove existing A record
- Add a new CNAME record:
  - Type: CNAME
  - Name: @ (for root domain)
  - Target: the ELB DNS address (from kubectl get ingress)
  - Proxy/Status: enable (orange cloud) to allow SSL via Cloudflare
- Wait for DNS propagation (≈ 5 minutes), then open in browser using your domain.

## Monitoring & Alerting
We use the kube-prometheus-stack Helm chart, which bundles Prometheus, Grafana, and Alertmanager.
### Install Monitoring Stack
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```
Wait until all pods in namespace monitoring are running:

```bash
kubectl get pods -n monitoring
```

### Accessing Grafana
- Retrieve Grafana admin password from Kubernetes secret:
```bash
kubectl get secret -n monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode
```

- Port-forward Grafana service:
```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

- Go to http://localhost:3000 in browser, login:
  - Username: admin
  - Password: the one you retrieved
> Grafana includes out-of-box dashboards. Explore the Dashboards menu.

### Alertmanager + Gmail Notifications
Because using your main Gmail password is insecure, you must create an App Password:
- Go to Google Account → Security → 2-Step Verification (enable if not already)
- Go to App Passwords
- Create a new password (e.g. "Alertmanager EKS"), copy the 16-character password
- Next, Create `alertmanager-values.yaml` in monitoring/ folder, e.g.:
```yaml
alertmanager:
  config:
    route:
      group_by: ["alertname","job"]
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 12h
      receiver: "gmail-receiver"
      routes: []
    receivers:
      - name: "gmail-receiver"
        email_configs:
          - to: "youremail@gmail.com"
            send_resolved: true
```
- Create alert rules file `my-alert-rules.yaml`:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: my-custom-rules
  namespace: monitoring
  labels:
    release: prometheus
spec:
  groups:
    - name: kubernetes-alerts
      rules:
        - alert: DeploymentReplicasMismatch
          expr: kube_deployment_spec_replicas != kube_deployment_status_replicas_available
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Deployment {{ $labels.deployment }} in namespace {{ $labels.namespace }} does not match its replica."
            description: "Deployment {{ $labels.deployment }} should have {{ $value }} replicas available, but it doesn’t."
```

Modify your cicd.yml job to install/upgrade the monitoring stack with -f monitoring/alertmanager-values.yaml, set SMTP & Gmail parameters from secrets, and apply alert rules.

## Testing with Watchdog Alert
To test that notifications actually work without touching your real application:
- Create `watchdog-alert.yaml`:
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: watchdog-rule
  namespace: monitoring
  labels:
    release: prometheus
spec:
  groups:
    - name: test-alerts
      rules:
        - alert: Watchdog
          expr: vector(1) == 1
          for: 1m
          labels:
            severity: none
          annotations:
            summary: "This is a test alert to ensure the notification pipeline is working."
```
- Apply it:
```bash
kubectl apply -f monitoring/watchdog-alert.yaml
```
- Port-forward Prometheus UI:
```bash
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
```
- After about 1 minute, the Watchdog alert should show as Firing, and you should receive an email notification from Alertmanager via Gmail.
- After testing, delete it to stop repeated alerts:
```bash
kubectl delete -f monitoring/watchdog-alert.yaml
```

## Cleanup / Delete Resources
To avoid incurring costs beyond Free Tier, clean up everything when you’re done:
- In Terraform folder:
```bash
terraform destroy
```
- Remove DNS entries in your domain provider
- In Kubernetes cluster (if still running):
```bash
kubectl delete namespace monitoring
kubectl delete namespace ingress-nginx
kubectl delete deployment restapi-users-deployment
kubectl delete service restapi-users-service
kubectl delete ingress restapi-users-ingress
```
- Delete ECR repository, VPC, EKS, etc. (handled by Terraform destroy)

## Appendix: Sample Files & Snippets
- `Dockerfile`:
```yaml
# --- Build Stage ---
FROM node:alpine3.20 AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

COPY . .

# --- Production Stage ---
FROM node:alpine3.20

WORKDIR /app

# Only install production dependencies for a smaller, safer image
COPY package*.json ./
RUN npm install --only=production

# Copy the app from the 'builder' stage
COPY --from=builder /app .

# Expose the port
EXPOSE 5000

# run the app
CMD ["node", "index.js"]
```

- `healthcheck.test.js`:
```javascript
import request from "supertest";
import app from "../index.js";

describe("GET /healthz", () => {
  it('should respond with a 200 status code and the message "OK"', async () => {
    const response = await request(app).get("/healthz");
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("OK");
  });
});

```
### Ingress replacement in pipeline
- In `cicd.yml`:
```yaml
- name: Update Ingress manifest with correct hostname
  run: sed -i "s|__INGRESS_HOSTNAME__|${{ env.INGRESS_HOSTNAME }}|g" k8s/ingress.yaml
```
- Helm upgrade for monitoring in pipeline
```yaml
- name: Deploy Monitoring Stack
  run: |
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
      --namespace monitoring \
      -f monitoring/alertmanager-values.yaml \
      --set alertmanager.config.global.resolve_timeout='5m' \
      --set alertmanager.config.global.smtp_from='${{ secrets.GMAIL_USERNAME_MONITORING }}' \
      --set alertmanager.config.global.smtp_smarthost='smtp.gmail.com:587' \
      --set alertmanager.config.global.smtp_auth_username='${{ secrets.GMAIL_USERNAME_MONITORING }}' \
      --set alertmanager.config.global.smtp_auth_password='${{ secrets.GMAIL_APP_PASSWORD_MONITORING }}'
    kubectl apply -f monitoring/my-alert-rules.yaml
```

## Project Members
- Juwono (https://github.com/Juwono136)



