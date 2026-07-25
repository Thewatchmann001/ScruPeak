FROM edoburu/pgbouncer:latest

# Set up the configuration directory
USER root
RUN mkdir -p /etc/pgbouncer

# Copy configuration and userlist
# These paths should match the pgbouncer.ini configuration
COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY userlist.txt /etc/pgbouncer/userlist.txt

RUN chown -R pgbouncer:pgbouncer /etc/pgbouncer

USER pgbouncer
EXPOSE 6432