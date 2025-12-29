"""
URL configuration for SSSIT project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# from django.contrib import admin
# from django.urls import path, include, re_path
# from django.conf import settings
# from django.conf.urls.static import static
# from django.views.generic import TemplateView

# urlpatterns = [
#     path('admin/', admin.site.urls),

#     # API routes
#     path('api/', include('page.urls')),
# ]

# # React catch-all (MUST be last)
# urlpatterns += [
#     re_path(
#         r'^(?!api/|assets/|admin/).*$', 
#         TemplateView.as_view(template_name="index.html")
#     ),
# ]


# # Media files (local / demo only)
# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)




from django.contrib import admin
from django.views.generic import TemplateView
from django.urls import path, include, re_path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("page.urls")),
]

# React catch-all — GET only
def react_view(request):
    if request.method != "GET":
        from django.http import HttpResponseNotAllowed
        return HttpResponseNotAllowed(["GET"])
    return TemplateView.as_view(template_name="index.html")(request)

urlpatterns += [
    re_path(r"^(?!api/|assets/|admin/).*$", react_view),
]
