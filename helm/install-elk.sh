

helm ls -n logging

helm install elasticsearch elastic/elasticsearch -n logging -f .\elk\elasticsearch.yaml --create-namespace
helm install kibana elastic/kibana -n logging -f .\elk\kibana.yaml
helm install metricbeat elastic/metricbeat -n logging -f .\elk\metricbeat.yaml
helm install logstash elastic/logstash -n logging -f .\elk\logstash.yaml
helm install filebeat elastic/filebeat -n logging -f .\elk\filebeat.yaml

helm uninstall elasticsearch -n logging
helm uninstall kibana -n logging
helm uninstall metricbeat -n logging
helm uninstall logstash -n logging
helm uninstall filebeat -n logging