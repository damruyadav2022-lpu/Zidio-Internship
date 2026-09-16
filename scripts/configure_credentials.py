#!/usr/bin/env python3
"""
RetailPulse Safe Credentials Configurator
Allows developers and merchants to safely configure real live credentials
for Razorpay, Shopify, Amazon SP-API, and SMTP without leaking secrets.
"""

import os
import sys
import getpass

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(PROJECT_DIR, ".env")

def load_env() -> dict:
    env_vars = {}
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

def save_env(env_vars: dict):
    lines = []
    # Preserve clean formatting
    lines.append("# RetailPulse Production Environment Configuration")
    lines.append(f"ENVIRONMENT={env_vars.get('ENVIRONMENT', 'production')}")
    lines.append(f"PORT={env_vars.get('PORT', '8000')}")
    lines.append(f"DATABASE_URL={env_vars.get('DATABASE_URL', 'sqlite:///./retailpulse.db')}")
    lines.append(f"JWT_SECRET={env_vars.get('JWT_SECRET', 'retailpulse_enterprise_jwt_secret_key_2026')}")
    lines.append("")
    
    lines.append("# Razorpay Payment Gateway")
    lines.append(f"RAZORPAY_KEY_ID={env_vars.get('RAZORPAY_KEY_ID', '')}")
    lines.append(f"RAZORPAY_KEY_SECRET={env_vars.get('RAZORPAY_KEY_SECRET', '')}")
    lines.append("")

    lines.append("# Shopify Partner API")
    lines.append(f"SHOPIFY_API_KEY={env_vars.get('SHOPIFY_API_KEY', '')}")
    lines.append(f"SHOPIFY_API_SECRET={env_vars.get('SHOPIFY_API_SECRET', '')}")
    lines.append("")

    lines.append("# Amazon SP-API")
    lines.append(f"AMAZON_SELLER_ID={env_vars.get('AMAZON_SELLER_ID', '')}")
    lines.append(f"AMAZON_LWA_APP_ID={env_vars.get('AMAZON_LWA_APP_ID', '')}")
    lines.append(f"AMAZON_LWA_CLIENT_SECRET={env_vars.get('AMAZON_LWA_CLIENT_SECRET', '')}")
    lines.append(f"AMAZON_REFRESH_TOKEN={env_vars.get('AMAZON_REFRESH_TOKEN', '')}")
    lines.append("")

    lines.append("# Automated Supplier PO Email Dispatch (SendGrid / SMTP)")
    lines.append(f"SMTP_HOST={env_vars.get('SMTP_HOST', 'smtp.sendgrid.net')}")
    lines.append(f"SMTP_PORT={env_vars.get('SMTP_PORT', '587')}")
    lines.append(f"SMTP_USER={env_vars.get('SMTP_USER', 'apikey')}")
    lines.append(f"SMTP_PASSWORD={env_vars.get('SMTP_PASSWORD', '')}")
    lines.append(f"DEFAULT_FROM_EMAIL={env_vars.get('DEFAULT_FROM_EMAIL', 'procurement@retailpulse.ai')}")

    with open(ENV_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"[Success] Updated credentials saved securely to {ENV_PATH}")

def configure_razorpay(env_vars: dict):
    print("\n--- Configure Razorpay Credentials ---")
    print("Obtain your keys at: https://dashboard.razorpay.com/#/app/keys")
    key_id = input("Enter RAZORPAY_KEY_ID (e.g. rzp_test_... or rzp_live_...): ").strip()
    if key_id:
        env_vars["RAZORPAY_KEY_ID"] = key_id
    secret = getpass.getpass("Enter RAZORPAY_KEY_SECRET (typing hidden): ").strip()
    if secret:
        env_vars["RAZORPAY_KEY_SECRET"] = secret
    print("[OK] Razorpay credentials recorded.")

def configure_shopify(env_vars: dict):
    print("\n--- Configure Shopify Partner Credentials ---")
    print("Obtain your keys from: Shopify Partner Dashboard -> Apps -> App Setup")
    api_key = input("Enter SHOPIFY_API_KEY: ").strip()
    if api_key:
        env_vars["SHOPIFY_API_KEY"] = api_key
    secret = getpass.getpass("Enter SHOPIFY_API_SECRET (typing hidden): ").strip()
    if secret:
        env_vars["SHOPIFY_API_SECRET"] = secret
    print("[OK] Shopify credentials recorded.")

def configure_amazon(env_vars: dict):
    print("\n--- Configure Amazon SP-API Credentials ---")
    print("Obtain credentials from: Amazon Seller Central -> Developer Console -> LWA")
    seller_id = input("Enter AMAZON_SELLER_ID: ").strip()
    if seller_id:
        env_vars["AMAZON_SELLER_ID"] = seller_id
    app_id = input("Enter AMAZON_LWA_APP_ID: ").strip()
    if app_id:
        env_vars["AMAZON_LWA_APP_ID"] = app_id
    secret = getpass.getpass("Enter AMAZON_LWA_CLIENT_SECRET (typing hidden): ").strip()
    if secret:
        env_vars["AMAZON_LWA_CLIENT_SECRET"] = secret
    refresh_tok = getpass.getpass("Enter AMAZON_REFRESH_TOKEN (typing hidden): ").strip()
    if refresh_tok:
        env_vars["AMAZON_REFRESH_TOKEN"] = refresh_tok
    print("[OK] Amazon SP-API credentials recorded.")

def configure_smtp(env_vars: dict):
    print("\n--- Configure Supplier Email PO Dispatch ---")
    host = input("Enter SMTP_HOST [default: smtp.sendgrid.net]: ").strip()
    if host:
        env_vars["SMTP_HOST"] = host
    user = input("Enter SMTP_USER [default: apikey]: ").strip()
    if user:
        env_vars["SMTP_USER"] = user
    password = getpass.getpass("Enter SMTP_PASSWORD / SendGrid API Key (typing hidden): ").strip()
    if password:
        env_vars["SMTP_PASSWORD"] = password
    from_email = input("Enter DEFAULT_FROM_EMAIL [default: procurement@retailpulse.ai]: ").strip()
    if from_email:
        env_vars["DEFAULT_FROM_EMAIL"] = from_email
    print("[OK] Email dispatch credentials recorded.")

def main():
    print("=" * 60)
    print(" RetailPulse Safe Credentials Configuration Utility")
    print("=" * 60)
    print("1. Razorpay (Live or Test Payment Gateway)")
    print("2. Shopify (Partner API Keys)")
    print("3. Amazon SP-API (Selling Partner API)")
    print("4. SMTP / SendGrid (Automated Supplier PO Emails)")
    print("5. Configure All")
    print("0. Exit")

    choice = input("\nSelect an option [0-5]: ").strip()
    if choice == "0":
        print("Exiting.")
        return 0

    env_vars = load_env()

    if choice in ("1", "5"):
        configure_razorpay(env_vars)
    if choice in ("2", "5"):
        configure_shopify(env_vars)
    if choice in ("3", "5"):
        configure_amazon(env_vars)
    if choice in ("4", "5"):
        configure_smtp(env_vars)

    save_env(env_vars)
    return 0

if __name__ == "__main__":
    sys.exit(main())
