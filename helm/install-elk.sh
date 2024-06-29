

helm ls -n logging

#helm install elk-elasticsearch elastic/elasticsearch -n logging -f .\elk\elasticsearch.yaml
#helm install elk-kibana elastic/kibana -n logging -f .\elk\kibana.yaml
#helm install elk-metricbeat elastic/metricbeat -n logging -f .\elk\metricbeat.yaml
#helm install elk-logstash elastic/logstash -n logging -f .\elk\logstash.yaml
#helm install elk-filebeat elastic/filebeat -n logging -f .\elk\filebeat.yaml

helm uninstall elk-elasticsearch -n logging
helm uninstall elk-kibana -n logging
helm uninstall elk-metricbeat -n logging
helm uninstall elk-logstash -n logging
helm uninstall elk-filebeat -n logging