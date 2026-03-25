FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG SLN_PATH
ARG MAIN_CSPROJ_PATH
ARG ROOT_FOLDER
ENV SRC /app
ENV COMPILE_TARGET Release
ENV COMPILE_DIRECTORY_TARGET compile


ARG PAT
ENV PAT ${PAT}

RUN wget -qO- https://raw.githubusercontent.com/Microsoft/artifacts-credprovider/master/helpers/installcredprovider.sh | bash
ENV NUGET_CREDENTIALPROVIDER_SESSIONTOKENCACHE_ENABLED true
ENV VSS_NUGET_EXTERNAL_FEED_ENDPOINTS "{\"endpointCredentials\": [{\"endpoint\":\"https://nuget.pkg.github.com/elyspio/index.json\", \"password\":\"${PAT}\"}]}"



RUN mkdir ${SRC}

# Optim cache for "dotnet restore" with only csproj files
COPY ${SLN_PATH} ${SRC}/

RUN mkdir -p ${SRC}/${ROOT_FOLDER}

COPY ${ROOT_FOLDER}/**/*.csproj ${SRC}/${ROOT_FOLDER}

WORKDIR ${SRC}/${ROOT_FOLDER}
RUN find *.csproj | sed -e 's/.csproj//g' | xargs mkdir -p
RUN find *.csproj | sed -r -e 's/((.+).csproj)/.\/\1 .\/\2/g' | xargs -I % sh -c 'mv %'


COPY ${ROOT_FOLDER}/nuget.config ${SRC}/${ROOT_FOLDER}

WORKDIR ${SRC}/${ROOT_FOLDER}

RUN dotnet restore ./${MAIN_CSPROJ_PATH} --configfile ./nuget.config -f

COPY ${ROOT_FOLDER} ${SRC}/${ROOT_FOLDER}


RUN dotnet publish ./${MAIN_CSPROJ_PATH} --no-restore -c ${COMPILE_TARGET} -o  ${SRC}/${COMPILE_DIRECTORY_TARGET}

#
# Deploiement du container docker
#
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS production
ARG ENTRY_DLL
ENV ENTRY_DLL ${ENTRY_DLL}

# Configuration de la timezone en EUROPE/PARIS + editeur nano
RUN apt-get update && apt-get install tzdata -y && apt-get install -y locales nano \
    && rm -rf /var/lib/apt/lists/* \
    && localedef -i fr_FR -c -f UTF-8 -A /usr/share/locale/locale.alias fr_FR.UTF-8 \
    && ln -fs /usr/share/zoneinfo/Europe/Paris /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata
ENV LANG fr_FR.utf8

COPY --from=build /app/compile app/
RUN chown -R 1000:1000 /app

ENV ASPNETCORE_URLS http://+:5000
ENV ASPNETCORE_ENVIRONMENT Production
USER 1000
EXPOSE 5000
WORKDIR /app

CMD dotnet $ENTRY_DLL