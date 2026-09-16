import socket
import ipaddress
import urllib.parse
import hmac
import hashlib
from typing import Tuple

def is_safe_ip(ip_str: str) -> bool:
    """
    Evaluates whether an IP address is a safe public routable target.
    Blocks loopback, link-local, private (RFC 1918), multicast, and reserved addresses.
    """
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_loopback:
            return False
        if ip.is_private:
            return False
        if ip.is_link_local:
            return False
        if ip.is_multicast:
            return False
        if ip.is_reserved:
            return False
        if ip.is_unspecified:
            return False
        # Specific block for AWS/GCP metadata IP
        if ip_str == "169.254.169.254":
            return False
        return True
    except ValueError:
        return False

def validate_outbound_url(target_url: str) -> Tuple[bool, str]:
    """
    Comprehensive SSRF defense validator.
    Parses scheme, validates hostname, resolves DNS, and blocks internal/private IPs.
    Returns (is_valid, error_message).
    """
    if not target_url or not isinstance(target_url, str):
        return False, "Target URL must be a non-empty string."

    parsed = urllib.parse.urlparse(target_url.strip())
    if parsed.scheme.lower() not in ("http", "https"):
        return False, f"Invalid URL scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "Invalid URL: hostname could not be determined."

    # Direct IP string check
    if is_safe_ip(hostname) is False:
        # Check if it was an IP
        try:
            ipaddress.ip_address(hostname)
            return False, f"Access to private/internal IP address '{hostname}' is prohibited (SSRF defense)."
        except ValueError:
            pass

    # Block well-known localhost / metadata hostnames
    lowered = hostname.lower()
    if lowered in ("localhost", "127.0.0.1", "0.0.0.0", "metadata.google.internal", "instance-data"):
        return False, f"Access to internal host '{hostname}' is prohibited (SSRF defense)."

    # Resolve hostname to all associated IPs and verify safety
    try:
        port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
        addr_info = socket.getaddrinfo(hostname, port, socket.AF_UNSPEC, socket.SOCK_STREAM)
        for entry in addr_info:
            sockaddr = entry[4]
            ip_val = sockaddr[0]
            if not is_safe_ip(ip_val):
                return False, f"Host '{hostname}' resolves to private/internal address '{ip_val}'. Request blocked."
    except socket.gaierror:
        # Host could not be resolved
        return False, f"Could not resolve host '{hostname}'. DNS lookup failed."
    except Exception as e:
        return False, f"Error resolving target host: {str(e)}"

    return True, "URL is safe for outbound dispatch."

def verify_razorpay_signature(order_id: str, payment_id: str, signature: str, secret: str) -> bool:
    """
    Cryptographic verification of Razorpay webhook / client payment signature.
    Signature = HMAC-SHA256(order_id + '|' + payment_id, secret)
    """
    if not order_id or not payment_id or not signature or not secret:
        return False
    
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    expected = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
