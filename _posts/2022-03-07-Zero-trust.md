---
layout: post
title: Cyberseguridad y el zero trust
subtitle: ¿que es Zero trust?
cover-img: /assets/img/Scifi.1920x1080.jpg
thumbnail-img: /assets/img/Scifi.1920x1080.jpg
share-img: /assets/img/Scifi.1920x1080.jpg
tags: [Zero Trust, identidad,blockchain]
---

Hay 3 tendencias que están impulsando la seguridad cibernética en este momento. Los tres están teniendo un efecto profundo en la industria. El primero no será una sorpresa para nadie, y es confianza cero. Esto se ha convertido en un tema de primer nivel en la industria. Es un concepto que ha existido durante más de una década, que se basa en la idea de “nunca confíes, siempre verifica”. La razón es que a medida que las organizaciones se trasladan a la nube híbrida, están aprendiendo sobre muchos grandes problemas en torno a la ciberseguridad que no se dieron cuenta o trataron de ignorar allí. Por ejemplo: saber realmente dónde están todos los datos confidenciales de toda la organización. La confianza cero ayuda a abordar estos grandes obstáculos en torno a la ciberseguridad, con el enfoque adecuado en los datos confidenciales.

Se describe cada compromiso de confianza cero como una combinación de los siguientes puntos. En primer lugar, queremos asegurarnos de que solo puedan ingresar los _usuarios_ correctos. Deseamos asegurar que solo los usuarios correctos puedan obtener el _acceso_ correcto, Además, de que solo puedan acceder a los _datos_ correctos, solo por la _razón_ correcta. Esencialmente, se trata de aseverar que solo los _usuarios_ correctos puedan obtener el _acceso_ correcto a los _datos_ correctos solo por la _razón_ correcta. Para ello se enfoca en una docena de controles diferentes para implementar realmente esos 4 conceptos básicos (usuarios, acceso, datos,razon o motivo).

- El primero de estos controles es el de gobernar la identidad que sirve para darle respuesta la pregunta ¿sabes quién tiene acceso a qué?
- El segundo, es el análisis de identidad. Corresponde analizar y saber si el objeto, que puede ser una persona o un proceso de una aplicación, tiene sentido que tenga accesos a determinada cantidad de recursos. Responde ante la pregunta ¿debería ese grupo de personas tener acceso?
- El tercero tiene que ver con las amenazas internas, y se trata de la administración de cuentas privilegiadas. Para ello se hace uso de controles mas restringidos para dichas cuentas y nos basamos en el acceso limitado a la tarea relacionada al puesto de trabajo. 
- Ademas se hace uso de la autenticación adaptativa. Esto es, cada vez que alguien quiere acceder a algo que es confidencial, se desarrolla una puntuación de riesgo en torno a ello. Existen otros indicadores para dicha identidad que se verifican dependiendo del nivel de sensibilidad de los datos y aplicaciones que ella desee acceder y los sistemas de verificación de la identidad requerirán otros usos de autenticación para garantizar que el riesgo que se trate de una cuenta comprometida sea menor.
- El siguiente punto enfoca nuestra atención en los datos. Lo primero es el descubrimiento y la clasificación de estos. Debemos asegurarnos de saber dónde están todos los datos confidenciales, tanto en las instalaciones como en cualquier proveedor en la nube y clasificarlos de acuerdo a su sensibilidad y riesgos que puedan repercutir la organizacion.  
- Una vez identificados y clasificados, necesitamos bloquearlos ante cualquier agente no autorizado. Hablamos entonces de cifrar o encriptar los datos.
- Lo siguiente es que querremos monitorizar la actividad de archivos y datos, asegurando de que cuando se tenga acceso a los datos se pueda limitar el acceso a los mismos. 
- Y finalmente, administrar las claves de cifrado que protegen esos datos.
- Los siguientes tres puntos tiene que ver con la razon o motivo. Una vez que tenemos al usuario correcto accediendo a la informacion correcta como podemos determinar que accede por las razones correctas. La información sobre riesgos de datos es uno de los puntos que aborda esto. Si vamos a una arquitectura basada en la nube, se pueden observar grandes franjas de datos que se utilizan durante largos períodos de tiempo y encontrar cosas que simplemente se le pasaron por alto la primera vez. Es muy poderoso. 
- Lo siguiente es el manejo del fraude transaccional.  
- Y finalmente, la configuración y la administración. hay tres tipos de configuración y administración que requieren nuestra atencion: Los dipositivos (portátiles, móviles, servidores, etc), la configuración y administración de la red y por ultimo la gestión de la configuración del stack nativo de la nube, que es lo mas delicado y que perjudica a muchas organizaciones hoy en dia. 


Esos son los 12 controles que vemos que aparecen en casi todos los proyectos de confianza cero. Existen diferentes controles tecnicos aplicados a cada uno de ellos y a veces en capas que se solapan para garantizar lo que se conoce como security in depth.
