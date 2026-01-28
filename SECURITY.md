# Security Policy

## Reporting Security Issues

If you discover a security vulnerability in Argus, please report it by emailing the maintainers. Please do not create public GitHub issues for security vulnerabilities.

## Security Best Practices

### 1. Environment Variables

**Never commit sensitive information to version control!**

The following files should NEVER be committed:
- `src/main/resources/application.properties` (with actual credentials)
- `.env` (with actual credentials)
- Any file containing passwords, API keys, or secrets

Files that SHOULD be committed:
- `src/main/resources/application.properties.example` (template only)
- `.env.example` (template only)

### 2. JWT Secret

- Use a strong, randomly generated secret key (minimum 256 bits)
- Never use the example secret in production
- Rotate secrets periodically
- Generate a secure secret using:
  ```bash
  openssl rand -base64 32
  ```

### 3. Database Security

- Use strong passwords for database users
- Create a dedicated database user for Argus with limited privileges
- Never use root/admin accounts
- Enable SSL/TLS for database connections in production
- Regularly backup your database

### 4. Email Configuration

- Use app-specific passwords, not your main email password
- For Gmail, enable 2FA and create an app-specific password
- Limit email account permissions to sending only
- Use environment variables for credentials

### 5. Redis Security

- Set a password for Redis in production
- Bind Redis to localhost or use firewall rules
- Use Redis ACLs if available
- Keep Redis updated

### 6. Production Deployment

#### Recommended Steps:

1. **Use Environment Variables**
   ```bash
   export DB_PASSWORD="$(openssl rand -base64 32)"
   export JWT_SECRET="$(openssl rand -base64 32)"
   ```

2. **Enable HTTPS**
   - Use a reverse proxy (nginx, Apache)
   - Obtain SSL certificates (Let's Encrypt)
   - Redirect HTTP to HTTPS

3. **Database Security**
   - Enable SSL connections
   - Use strong authentication
   - Regular backups
   - Network isolation

4. **Application Security**
   - Keep dependencies updated
   - Regular security audits
   - Rate limiting
   - Input validation

5. **Monitoring**
   - Enable audit logging
   - Monitor failed login attempts
   - Set up alerts for suspicious activity

### 7. Development vs Production

| Configuration | Development | Production |
|--------------|-------------|------------|
| JWT Secret | Can use example | **Must be strong & unique** |
| Database Password | Can be simple | **Must be strong** |
| SSL/TLS | Optional | **Required** |
| HTTPS | Optional | **Required** |
| Debug Mode | Enabled | **Disabled** |
| Show SQL | Can enable | **Disabled** |

### 8. Secure Configuration Checklist

- [ ] All passwords are strong and unique
- [ ] JWT secret is cryptographically secure (256+ bits)
- [ ] application.properties is in .gitignore
- [ ] .env files are in .gitignore
- [ ] HTTPS is enabled in production
- [ ] Database uses SSL/TLS
- [ ] Redis has authentication enabled
- [ ] Email uses app-specific password
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] Security headers are set
- [ ] Dependencies are up to date

### 9. Example Secure Setup

```bash
# Generate secure secrets
export JWT_SECRET=$(openssl rand -base64 32)
export DB_PASSWORD=$(openssl rand -base64 24)

# Set other environment variables
export DB_USERNAME=argus_user
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=argus_db
export REDIS_HOST=localhost
export REDIS_PORT=6379
export MAIL_HOST=smtp.gmail.com
export MAIL_PORT=587
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-app-specific-password
export MAIL_FROM_EMAIL=your-email@gmail.com

# Run the application
./mvnw spring-boot:run
```

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Known Security Considerations

1. **WebSocket Security**: Ensure WebSocket connections are authenticated
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **Input Validation**: All user inputs are validated and sanitized
4. **SQL Injection**: Using JPA/Hibernate with parameterized queries
5. **XSS Protection**: Frontend sanitizes all user-generated content

## Updates and Patches

- Regularly update dependencies
- Monitor security advisories
- Apply patches promptly
- Keep Java, Spring Boot, and libraries current

## Contact

For security concerns, please contact the project maintainers directly.
