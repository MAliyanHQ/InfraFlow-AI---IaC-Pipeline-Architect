
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

const FALLBACK_PROJECT: AIResponse = {
  projectTitle: "Global Scalable App Hub",
  terraform: `# Terraform Fallback Configuration
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "infraflow-vpc" }
}

resource "aws_eks_cluster" "primary" {
  name     = "production-cluster"
  role_arn = aws_iam_role.eks.arn
  vpc_config {
    subnet_ids = aws_subnet.public[*].id
  }
}

resource "aws_rds_cluster" "db" {
  cluster_identifier = "production-db"
  engine             = "aurora-postgresql"
  database_name      = "app_db"
  master_username    = "admin"
  master_password    = "SecurePassword123!"
}`,
  ansible: `# Ansible Fallback Playbook
- name: Configure Production Nodes
  hosts: all
  become: yes
  tasks:
    - name: Update apt cache
      apt: update_cache=yes
    
    - name: Install CloudWatch Agent
      apt: name=amazon-cloudwatch-agent state=present

    - name: Deploy Application Container
      docker_container:
        name: main_api
        image: "registry.hub.docker.com/org/api:latest"
        state: started
        restart_policy: always
        ports:
          - "80:8080"`,
  explanation: "This architecture utilizes a modular VPC design with an EKS cluster for container orchestration and an Aurora PostgreSQL cluster for managed persistence. It is optimized for high availability and elastic scaling."
};

const FALLBACK_LOGS: Record<string, string[]> = {
  LINT: [
    "[INFO] Initializing TFLint...",
    "[INFO] Checking Terraform syntax...",
    "[SUCCESS] All files follow HCL best practices.",
    "[INFO] Running ansible-lint...",
    "[SUCCESS] Playbooks validated."
  ],
  SECURITY: [
    "[INFO] Scanning with tfsec...",
    "[INFO] Analyzing AWS Resource permissions...",
    "[WARN] Low-risk issue: Public S3 bucket not explicitly blocked (ignoring per config).",
    "[SUCCESS] Security check passed. 0 high, 0 medium vulnerabilities."
  ],
  PLAN: [
    "[INFO] Refreshing Terraform state...",
    "[INFO] Generating execution plan...",
    "[INFO] Plan: 14 to add, 0 to change, 0 to destroy.",
    "[SUCCESS] Plan file saved to /tmp/tfplan."
  ],
  PROVISION: [
    "[INFO] Applying plan...",
    "[PROGRESS] aws_vpc.main: Creating... [10%]",
    "[PROGRESS] aws_vpc.main: Creation complete [100%]",
    "[PROGRESS] aws_eks_cluster.primary: Creating... [45%]",
    "[PROGRESS] aws_eks_cluster.primary: Still creating... [80%]",
    "[SUCCESS] Infrastructure provisioned successfully."
  ],
  CONFIGURE: [
    "[INFO] Connecting to worker nodes via SSH...",
    "[INFO] TASK [Update apt cache] ******************",
    "[INFO] ok: [node-01]",
    "[INFO] TASK [Install CloudWatch Agent] *********",
    "[INFO] changed: [node-01]",
    "[SUCCESS] Configuration drift corrected. Nodes are ready."
  ]
};

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateInfrastructure(prompt: string): Promise<AIResponse> {
    const ai = this.getClient();
    try {
      if (!process.env.API_KEY) throw new Error("No API Key");
      
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `You are a world-class DevOps engineer. 
        Generate a complete Terraform configuration and an Ansible playbook for: "${prompt}".
        Return JSON with projectTitle, terraform, ansible, and explanation.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectTitle: { type: Type.STRING },
              terraform: { type: Type.STRING },
              ansible: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["projectTitle", "terraform", "ansible", "explanation"],
          }
        },
      });

      const text = response.text || '{}';
      return JSON.parse(text);
    } catch (error) {
      console.warn("Gemini failing, using high-quality fallback simulation.", error);
      return { ...FALLBACK_PROJECT, projectTitle: "Simulated: " + (prompt.slice(0, 20) + "...") };
    }
  }

  async simulateLog(stepType: string, code: string): Promise<string[]> {
    const ai = this.getClient();
    try {
      if (!process.env.API_KEY) throw new Error("No API Key");
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a short command-line log output for a CI/CD ${stepType} step for this code: ${code.slice(0, 500)}`,
      });

      return (response.text || "").split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      return FALLBACK_LOGS[stepType] || ["[INFO] Executing step...", "[SUCCESS] Task completed."];
    }
  }
}

export const gemini = new GeminiService();
