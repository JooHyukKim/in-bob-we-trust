docker run -d \
    -p 8888:8888 \
    -e COMMAND_LINE_ARGS_BEFORE='-Dspring.data.mongodb.database=inbobwetrust -Dspring.data.mongodb.primary.uri=mongodb://host.docker.internal:27017'  \
    -e COMMAND_LINE_ARGS_AFTER='--spring.profiles.active=loadtest'  \
    inbobwetrust/delivery-info-service:loadtest