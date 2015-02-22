from django.conf.urls import url

from diplomacy.core.views import MapView

urlpatterns = [
    url(r'^/?$', MapView.as_view()),
]
