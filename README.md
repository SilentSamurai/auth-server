# Auth Server

General-purpose HTTP-based authentication and authorization server. Built with [Node.js](https://nodejs.org/)
and [Nest.js](https://nestjs.com/).

**Features**

- User registration and verification via email.
- Basic authentication using email and password.
- Authorization using [JSON Web Tokens](https://jwt.io/).
- Delete not verified users after the verification token expires.
- Reset password via email.
- Change email address via email.
- API [documentation](https://silentsamurai.github.io/Speedy-API) available.


# minikube 
docker context use default
minikube start
minikube addons enable metrics-server
minikube dashboard --url

minikube service <service-name> --url
minikube image build -t is-auth-server -f ./Dockerfile .
minikube image load your-image-name
