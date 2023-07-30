#!/bin/bash

# Set environment variable for root certificate path
export FABRIC_CA_CLIENT_TLS_CERTFILES=$LXHOME/fabric-ca-tls/crypto/ca-cert.pem

# Set environment variable for CA client home folder
export FABRIC_CA_CLIENT_HOME=$LXHOME/fabric-ca-tls/admin

# Prompt for TLS CA admin username and password
read -p "Enter TLS CA admin username: " tls_user
read -p "Enter TLS CA admin password: " -s tls_pass

# Log in as TLS CA admin
fabric-ca-client enroll -d -u https://$tls_user:$tls_pass@0.0.0.0:7052 --tls.certfiles $LXHOME/fabric-ca-tls/crypto/ca-cert.pem
