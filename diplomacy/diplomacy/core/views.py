from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.generic import View


class MapView(View):
    def get(self, request):
        data = {}
        return render_to_response("map.html", RequestContext(request, data))
